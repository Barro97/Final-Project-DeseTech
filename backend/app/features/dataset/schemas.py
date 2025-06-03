from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from typing import List

# class init with basic fields
class DatasetBase(BaseModel):
    dataset_name: str
    dataset_description: Optional[str] = None
    downloads_count: Optional[int] = 0
    uploader_id: int
    tags: List[str] = []

class DatasetCreate(DatasetBase):
    pass

class DatasetUpdate(DatasetBase):
    pass

class Dataset(BaseModel):
    dataset_id: int
    dataset_name: str
    dataset_description: Optional[str] = None
    downloads_count: Optional[int] = 0
    uploader_id: int
    date_of_creation: datetime
    dataset_last_updated: Optional[datetime] = None
    owners: List[int] = []

    class Config:
        from_attributes = True  # Updated from orm_mode for Pydantic v2

class OwnerActionRequest(BaseModel):
    user_id: int  # The ID of the user you want to add as an owner

