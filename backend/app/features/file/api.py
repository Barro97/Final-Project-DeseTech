from fastapi import Depends, APIRouter , UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.features.file.schemas import FileCreate
from backend.app.features.file.crud import create_file, get_file, delete_file_record, get_url
from backend.app.features.file.utils.upload import save_file, delete_file_from_storage
import os



router = APIRouter()

@router.post("/upload-file/")
async def create_file_route(dataset_id: int = Form(...), file: UploadFile = File(...), db: Session = Depends(get_db)):
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