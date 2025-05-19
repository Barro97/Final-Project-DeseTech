from fastapi import Depends, APIRouter, UploadFile, File as UploadFastFile, Form, HTTPException
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.features.file.schemas import FileCreate
from backend.app.features.file.crud import create_file, get_file, delete_file_record, get_url
from backend.app.features.file.utils.upload import save_file, delete_file_from_storage
import os
from fastapi.responses import FileResponse, StreamingResponse
from pathlib import Path
from backend.app.database.models import File, Dataset
from backend.app.features.authentication.utils.authorizations import get_current_user
from backend.app.features.file.utils.upload import client, SUPABASE_STORAGE_BUCKET
import io



router = APIRouter()

@router.post("/upload-file/")
async def create_file_route(dataset_id: int = Form(...), file: UploadFile = UploadFastFile(...), db: Session = Depends(get_db)):
    # Save the file itself
    file_path, size = save_file(file)

    # Construct a pydantic model that fits the data
    file_data = FileCreate(
        file_name=file.filename,
        file_type=file.content_type,
        size=size,
        file_url=file_path,
        dataset_id=dataset_id
    )

    return create_file(db=db, file_data=file_data)

@router.get("/files/{file_id}")
async def get_file_route(file_id: int, db: Session = Depends(get_db)):
    return get_file(db = db, file_id = file_id)

@router.delete("/delete_file/{file_id}")
async def delete_file_route(file_id: int, db: Session = Depends(get_db)):
    file_url = get_url(db = db, file_id = file_id)
    if not file_url:
        raise HTTPException(status_code=404,detail="File not found")
    
    try:
        delete_file_from_storage(file_url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"file deletion failed: {str(e)}")
    
    if delete_file_record(db = db, file_id = file_id):
        return {"detail":"File and record deleted"}
    else:
        raise HTTPException(status_code=500,detail="Record deletion failed")

@router.get("/{file_id}/download")
def download_file(
    file_id: int,
    db: Session = Depends(get_db),
    # current_user = Depends(get_current_user)
):
    """Download a file from Supabase cloud storage."""
    # Get the file record from the database
    file_record = db.query(File).filter(File.file_id == file_id).first()
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found in database")

    try:
        # Download the file bytes from Supabase storage
        # file_record.file_url stores the path/key of the file in the Supabase bucket
        file_bytes = client.storage.from_(SUPABASE_STORAGE_BUCKET).download(file_record.file_url)
        
        # The download method returns bytes directly or raises an error if not found/other issues.
        # If it could return None on "not found" without an exception, an explicit check would be needed.
        # Assuming it raises an exception for errors based on typical client library behavior.

    except Exception as e:
        # Log the specific Supabase error if possible, e.g., if e is a SupabaseStorageException
        print(f"Error downloading file {file_record.file_url} from Supabase: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to download file from cloud storage: {str(e)}")
    
    # Update download count for the dataset
    # if file_record.dataset_id:
    #     dataset = db.query(Dataset).filter(Dataset.dataset_id == file_record.dataset_id).first()
    #     if dataset:
    #         dataset.downloads_count += 1
    #         db.commit()
    #         db.refresh(dataset) # Refresh to get updated count if needed elsewhere in same request
    
    # Stream the file back to the client
    return StreamingResponse(
        io.BytesIO(file_bytes),
        media_type=file_record.file_type or 'application/octet-stream',
        headers={"Content-Disposition": f'attachment; filename="{file_record.file_name}"'}
    )