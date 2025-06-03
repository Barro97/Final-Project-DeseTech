from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session

from backend.app.features.dataset.schemas import DatasetCreate, Dataset as DatasetResponse, OwnerActionRequest
from backend.app.features.file.schemas import FileSchema
from backend.app.database.session import get_db
from backend.app.features.authentication.utils.authorizations import permit_action, get_current_user
from backend.app.features.dataset import crud
from typing import List
from pydantic import BaseModel
import zipfile
import io
from fastapi.responses import StreamingResponse
from backend.app.features.file.utils.upload import client, SUPABASE_STORAGE_BUCKET
import logging
from backend.app.database.models import Dataset, Tag, User  # SQLAlchemy models


router = APIRouter(prefix="/datasets")

@router.post("/", response_model=DatasetResponse)
def create_dataset(dataset_in: DatasetCreate, db: Session = Depends(get_db)):
    # Create the dataset object
    db_dataset = Dataset(
        dataset_name=dataset_in.dataset_name,
        dataset_description=dataset_in.dataset_description,
        downloads_count=dataset_in.downloads_count,
        uploader_id=dataset_in.uploader_id,
    )

    # Handle tags
    tag_objects = []
    for tag_name in dataset_in.tags:
        # Check if tag exists
        tag = db.query(Tag).filter_by(tag_category_name=tag_name).first()
        if not tag:
            # If it doesn't exist, create it
            tag = Tag(tag_category_name=tag_name)
            db.add(tag)
            db.commit()
            db.refresh(tag)
        tag_objects.append(tag)

    # Attach tags to the dataset
    db_dataset.tags = tag_objects

    # Save dataset
    db.add(db_dataset)
    db.commit()
    db.refresh(db_dataset)

    return db_dataset

#get for the dataset 
@router.get("/{dataset_id}", response_model=DatasetResponse)
def get_dataset(dataset_id: int, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.dataset_id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset

# updating information on the dataset
@router.put("/{dataset_id}", response_model=DatasetResponse)
def update_dataset(
    dataset_id: int,
    dataset_in: DatasetCreate,
    db: Session = Depends(get_db),
    user = Depends(permit_action("dataset"))
):
    db_dataset = db.query(Dataset).filter_by(dataset_id=dataset_id).first()
    if not db_dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    # Update fields
    db_dataset.dataset_name = dataset_in.dataset_name
    db_dataset.dataset_description = dataset_in.dataset_description
    db_dataset.downloads_count = dataset_in.downloads_count
    db_dataset.uploader_id = dataset_in.uploader_id

    # Update tags
    tag_objects = []
    for tag_name in dataset_in.tags:
        tag = db.query(Tag).filter_by(tag_category_name=tag_name).first()
        if not tag:
            tag = Tag(tag_category_name=tag_name)
            db.add(tag)
            db.commit()
            db.refresh(tag)
        tag_objects.append(tag)

    db_dataset.tags = tag_objects  # Reassign all tags

     #Add uploader as initial owner
    uploader = db.query(User).filter_by(user_id=dataset_in.uploader_id).first()
    if not uploader:
        raise HTTPException(status_code=400, detail="Uploader not found")
    db_dataset.owners = [uploader]  # start the owners list with the uploader

    db.commit()
    db.refresh(db_dataset)
    return db_dataset

# delete the dataset
@router.delete("/{dataset_id}", status_code=204)
def delete_dataset(dataset_id: int, db: Session = Depends(get_db), user = Depends(permit_action("dataset"))):
    db_dataset = db.query(Dataset).filter_by(dataset_id=dataset_id).first()
    if not db_dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    db.delete(db_dataset)
    db.commit()
    return

# api to add another owner to the dataset - allow more than one user to update and add files to the dataset
@router.post("/{dataset_id}/add-owner")
def add_dataset_owner(
    dataset_id: int,
    owner_request: OwnerActionRequest,
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.dataset_id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    user = db.query(User).filter(User.user_id == owner_request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user in dataset.owners:
        raise HTTPException(status_code=400, detail="User is already an owner")

    dataset.owners.append(user)
    db.commit()

    return {"message": "Owner added successfully"}

# api to remove the owner of dataset - in case a user stops working on a certain project 
@router.post("/{dataset_id}/remove-owner")
def remove_dataset_owner(
    dataset_id: int,
    owner_request: OwnerActionRequest,
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.dataset_id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    user = db.query(User).filter(User.user_id == owner_request.user_id).first()
    if not user or user not in dataset.owners:
        raise HTTPException(status_code=404, detail="User is not an owner")

    dataset.owners.remove(user)
    db.commit()

    return {"message": "Owner removed successfully"}

@router.get("/user/{user_id}", response_model=List[DatasetResponse])
def get_user_datasets(
    user_id: int, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all datasets where the specified user is an uploader or owner."""
    # Convert user_id from string to int if needed
    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    # Check authorization - user can only access their own datasets unless they're admin
    if current_user["user_id"] != user_id and current_user["role"] != "admin":
        raise HTTPException(
            status_code=403, 
            detail="Not authorized to view other users' datasets"
        )
    
    datasets = crud.get_user_datasets_crud(db=db, user_id=user_id)
    
    # Convert the response data
    result = []
    for dataset in datasets:
        result.append({
            **dataset.__dict__,
            'owners': [owner.user_id for owner in dataset.owners]
        })
    
    return result

@router.get("/{dataset_id}/files", response_model=List[FileSchema])
def get_dataset_files(
    dataset_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user) # Assuming current_user is needed for authorization, though not used in current logic
):
    """Get all files for a specific dataset."""
    files = crud.get_dataset_files_crud(db=db, dataset_id=dataset_id)
    return files

# Define a Pydantic model for the request body of the batch delete operation
class BatchDeleteRequest(BaseModel): 
    dataset_ids: List[int]

@router.delete("/batch-delete", status_code=200)
async def batch_delete_datasets_route(
    request_data: BatchDeleteRequest,
    db: Session = Depends(get_db),
    current_user_token: dict = Depends(get_current_user)
):
    # Extract dataset_ids from the Pydantic model
    dataset_ids = request_data.dataset_ids
    
    # Validate that we have dataset_ids
    if not dataset_ids:
        raise HTTPException(status_code=400, detail="dataset_ids list cannot be empty.")

    current_user_id = current_user_token.get("user_id")
    if not current_user_id:
        raise HTTPException(status_code=401, detail="Could not authenticate user")

    result = crud.batch_delete_datasets_crud(
        db=db,
        dataset_ids=dataset_ids,
        current_user_id=current_user_id
    )
    
    if result["errors"]:
        if result["deleted_count"] == 0 and len(result["errors"]) == len(dataset_ids):
             raise HTTPException(status_code=400, detail={"message": "No datasets were deleted. See errors for details.", "errors": result["errors"]})
        
        return {
            "message": f"Batch delete partially successful. {result['deleted_count']} datasets deleted.",
            "deleted_count": result["deleted_count"],
            "errors": result["errors"]
        }

    return {"message": f"Successfully deleted {result['deleted_count']} datasets.", "deleted_count": result["deleted_count"], "errors": []}

@router.delete("/{dataset_id}", status_code=204)
def delete_dataset_single(dataset_id: int, db: Session = Depends(get_db), user = Depends(permit_action("dataset"))):
    try:
        crud.delete_dataset_crud(db=db, dataset_id=dataset_id)
        # The service now returns True/False or raises HTTPException. 
        # If it returns True, the 204 No Content is appropriate.
        # If it raises an exception, FastAPI handles it.
        # For a 204 response, FastAPI expects no body, so we return None or nothing.
        return # Or return Response(status_code=204)
    except HTTPException as e:
        raise e # Re-raise HTTPException from service layer
    except Exception as e:
        # Catch any other unexpected errors from the service layer or this layer
        db.rollback() # Ensure rollback if not handled by service layer
        raise HTTPException(
            status_code=500,
            detail=f"Error during dataset deletion: {str(e)}"
        )

@router.get("/{dataset_id}/download")
def download_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Download all files in a dataset as a ZIP file."""
    try:
        # Get the dataset to ensure it exists
        dataset = crud.get_dataset_crud(db=db, dataset_id=dataset_id)
        
        # Get all files for the dataset
        files = crud.get_dataset_files_crud(db=db, dataset_id=dataset_id)
        
        if not files:
            raise HTTPException(status_code=404, detail="No files found in this dataset")
        
        # Create a zip file in memory
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            failed_files = []
            
            for file_obj in files:
                try:
                    # Download file from Supabase storage
                    file_bytes = client.storage.from_(SUPABASE_STORAGE_BUCKET).download(file_obj.file_url)
                    
                    # Add file to zip
                    zip_file.writestr(file_obj.file_name, file_bytes)
                    
                    logging.info(f"Successfully added {file_obj.file_name} to zip")
                    
                except Exception as e:
                    logging.error(f"Failed to download file {file_obj.file_name}: {str(e)}")
                    failed_files.append(file_obj.file_name)
                    continue
            
            # If there were failed files, add a log file to the zip
            if failed_files:
                error_log = f"The following files could not be downloaded:\n" + "\n".join(failed_files)
                zip_file.writestr("download_errors.txt", error_log.encode('utf-8'))
                logging.warning(f"Dataset {dataset_id} download completed with {len(failed_files)} failed files")
        
        zip_buffer.seek(0)
        
        # Create a safe filename for the zip
        safe_dataset_name = "".join(c for c in dataset.dataset_name if c.isalnum() or c in (' ', '-', '_')).rstrip()
        zip_filename = f"{safe_dataset_name}_{dataset_id}.zip"
        
        return StreamingResponse(
            io.BytesIO(zip_buffer.read()),
            media_type="application/zip",
            headers={"Content-Disposition": f'attachment; filename="{zip_filename}"'}
        )
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logging.error(f"Error creating dataset zip for dataset {dataset_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error creating dataset download: {str(e)}"
        )

