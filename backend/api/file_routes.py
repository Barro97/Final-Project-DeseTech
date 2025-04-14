from fastapi import Depends, APIRouter , UploadFile, File, Form
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.schemas.file import FileCreate
from backend.crud.file import create_file, get_file
from backend.features.upload import save_file
import os



router = APIRouter()

@router.post("/upload-file/")
async def create_file_route(dataset_id: int = Form(...), file: UploadFile = File(...), db: Session = Depends(get_db)):
    # print(f"file input: {file}")
    # print(f"dataset input: {dataset_id}")
    # Save the file itself
    file_path = save_file(file)

    # Get the size of the file
    size = os.path.getsize(file_path)

    # Construct a pydantic model that fits the data
    file_data = FileCreate(
        file_name = file.filename,
        file_type=file.content_type,   # e.g. 'text/csv', 'image/png', etc.
        size=size,
        file_url=file_path,                     
        dataset_id=dataset_id
    )

    return create_file(db = db, file_data = file_data)

@router.get("/files/{file_id}")
async def get_file_route(file_id: int, db: Session = Depends(get_db)):
    return get_file(db = db, file_id = file_id)
