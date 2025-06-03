from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from typing import List

# Backwards compatibility imports
from backend.app.features.dataset.schemas.request import (
    DatasetCreateRequest as DatasetCreate,
    DatasetUpdateRequest as DatasetUpdate,
    OwnerActionRequest,
    BatchDeleteRequest,
    DatasetFilterRequest
)
from backend.app.features.dataset.schemas.response import (
    DatasetResponse as Dataset,
    DatasetDetailResponse,
    DatasetListResponse,
    BatchDeleteResponse,
    OwnerActionResponse,
    DatasetStatsResponse
)

# Re-export for backwards compatibility
__all__ = [
    "DatasetCreate",
    "DatasetUpdate", 
    "Dataset",
    "OwnerActionRequest",
    "BatchDeleteRequest",
    "DatasetFilterRequest",
    "DatasetDetailResponse",
    "DatasetListResponse",
    "BatchDeleteResponse", 
    "OwnerActionResponse",
    "DatasetStatsResponse"
]

# class init with basic fields
class DatasetBase(BaseModel):
    dataset_name: str
    dataset_description: Optional[str] = None
    downloads_count: Optional[int] = 0
    uploader_id: int
    tags: List[str] = []

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

