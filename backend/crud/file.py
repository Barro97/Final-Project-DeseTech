from sqlalchemy.orm import Session
from backend.database.models import File
from backend.schemas.file import FileCreate

def create_file(db: Session , file: FileCreate ):
    db_file = File(**file.model_dump())
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return db_file


