from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from typing import List

# class init with basic fields
class DatasetBase(BaseModel):
    name: str
    description: Optional[str] = None
    download_count: Optional[int] = 0
    uploader_id: int
    tags: List[str]

class DatasetCreate(DatasetBase):
    pass

class DatasetUpdate(DatasetBase):
    pass

class Dataset(DatasetBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    owners: List[int]

    class Config:
        orm_mode = True

class OwnerActionRequest(BaseModel):
    user_id: int  # The ID of the user you want to add as an owner

