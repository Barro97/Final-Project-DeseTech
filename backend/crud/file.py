from sqlalchemy.orm import Session
from backend.database.models import File
from backend.schemas.file import FileCreate

def create_file(db: Session , file_data: FileCreate ):
    db_file = File(**file_data.model_dump()) #converts the pydantic model to a dictionary
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return db_file

def get_file(db: Session, file_id: int):
    return db.query(File).filter(File.file_id == file_id).first()