from datetime import datetime
from typing import Optional
from pydantic import BaseModel

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

    class Config:
        orm_mode = True



