from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class DatasetBase(BaseModel):
    dataset_name: str
    dataset_description: Optional[str] = None
    downloads_count: Optional[int] = 0
    uploader_id: int
    tags: Optional[List[str]] = None

class DatasetCreate(DatasetBase):
    pass

class DatasetUpdate(DatasetBase):
    pass

class Dataset(DatasetBase):
    dataset_id: int
    date_of_creation: datetime
    dataset_last_updated: Optional[datetime] = None
    
    # Keep this as is for now since you'll fix the DB issue separately
    owners: List[int] = []

    class Config:
        orm_mode = True
        # This tells Pydantic to map model attributes to schema fields
        from_attributes = True

class OwnerActionRequest(BaseModel):
    user_id: int

# Schema for file list in dataset response
class FileSchema(BaseModel):
    file_id: int
    file_name: str
    file_type: Optional[str] = None
    size: Optional[int] = None
    file_date_of_upload: datetime
    file_url: str
    dataset_id: int
    
    class Config:
        from_attributes = True

