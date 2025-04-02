from fastapi import Depends, APIRouter
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.schemas.file import FileCreate
from backend.crud.file import create_file


router = APIRouter()

@router.post("/files/")
async def create_file_route(file: FileCreate, db: Session = Depends(get_db)):
    return create_file(db = db, file = file)
