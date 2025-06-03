from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class FileBase(BaseModel):
    file_name: str
    file_type: Optional[str] = None
    size: Optional[int] = None
    file_url: Optional[str] = None
    dataset_id: Optional[int] = None

class FileCreate(FileBase):
    pass

class File(FileBase):
    file_id: int
    file_date_of_upload: datetime

    class Config:
        from_attributes = True  # Updated from orm_mode for Pydantic v2

# Add this for the dataset API to use
FileSchema = File