from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session
from backend.app.database.models import Dataset, Tag, File  # SQLAlchemy models
from backend.app.features.dataset.schemas import DatasetCreate, Dataset as DatasetResponse, OwnerActionRequest, FileSchema
from backend.app.database.session import get_db
from backend.app.features.user.models import User
from backend.app.features.authentication.utils.authorizations import permit_action, get_current_user
from backend.app.features.file.utils.upload import delete_file_from_storage
from typing import List
from sqlalchemy import or_

router = APIRouter(
    prefix="/datasets",
    tags=["datasets"]
)

@router.post("/", response_model=DatasetResponse)
def create_dataset(dataset_in: DatasetCreate, db: Session = Depends(get_db)):
    print("dataset_in: ", dataset_in)
    # 1. Create the dataset object
    db_dataset = Dataset(
        dataset_name=dataset_in.dataset_name,
        dataset_description=dataset_in.dataset_description,
        uploader_id=dataset_in.uploader_id,
    )
    print("db_dataset: ", db_dataset)
    
    # Add uploader as initial owner
    uploader = db.query(User).filter_by(user_id=dataset_in.uploader_id).first()
    if not uploader:
        raise HTTPException(status_code=400, detail="Uploader not found")
    
    # Save dataset first to get the ID
    db.add(db_dataset)
    db.commit()
    db.refresh(db_dataset)
    
    # Now add the owner relationship
    db_dataset.owners = [uploader]
    db.commit()
    
    # Refresh one more time to get the updated relationships
    db.refresh(db_dataset)
    
    # Convert the response to match the schema
    response_data = {
        **db_dataset.__dict__,
        'owners': [owner.user_id for owner in db_dataset.owners]
    }
    return response_data

@router.get("/{dataset_id}", response_model=DatasetResponse)
def get_dataset(dataset_id: int, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.dataset_id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Convert the response to match the schema
    response_data = {
        **dataset.__dict__,
        'owners': [owner.user_id for owner in dataset.owners]
    }
    return response_data

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
    
    # Convert the response to match the schema
    response_data = {
        **db_dataset.__dict__,
        'owners': [owner.user_id for owner in db_dataset.owners]
    }
    return response_data

@router.delete("/{dataset_id}", status_code=204)
def delete_dataset(dataset_id: int, db: Session = Depends(get_db), user = Depends(permit_action("dataset"))):
    try:
        # Start a transaction
        db_dataset = db.query(Dataset).filter_by(dataset_id=dataset_id).first()
        if not db_dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")

        # Delete all associated files from storage and database
        for file in db_dataset.files:
            try:
                # Delete file from storage
                delete_file_from_storage(file.file_url)
            except Exception as e:
                # Log the error but continue with other files
                print(f"Error deleting file {file.file_id} from storage: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Error deleting files from storage: {str(e)}"
                )

        # The dataset deletion will cascade to:
        # 1. Delete all file records (due to relationship in File model)
        # 2. Delete all dataset_owner records (due to secondary relationship)
        db.delete(db_dataset)
        db.commit()
        
        return {"message": "Dataset and all associated data deleted successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error during dataset deletion: {str(e)}"
        )


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
    # Verify that the current user is requesting their own datasets
    if current_user["user_id"] != user_id and current_user["role"] != "admin":
        raise HTTPException(
            status_code=403, 
            detail="Not authorized to view other users' datasets"
        )
    
    # Query datasets where user is either uploader or owner
    datasets = db.query(Dataset).filter(
        or_(
            Dataset.uploader_id == user_id,
            Dataset.owners.any(User.user_id == user_id)
        )
    ).all()
    
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
    current_user = Depends(get_current_user)
):
    """Get all files for a specific dataset."""
    # Check if dataset exists
    dataset = db.query(Dataset).filter(Dataset.dataset_id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Get all files for the dataset
    files = db.query(File).filter(File.dataset_id == dataset_id).all()
    
    return files
