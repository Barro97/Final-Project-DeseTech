from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class DatasetOwnerResponse(BaseModel):
    user_id: int
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None

    class Config:
        from_attributes = True


class DatasetTagResponse(BaseModel):
    tag_id: int
    tag_category_name: str

    class Config:
        from_attributes = True


class DatasetResponse(BaseModel):
    dataset_id: int
    dataset_name: str
    dataset_description: Optional[str] = None
    downloads_count: int = 0
    uploader_id: int
    date_of_creation: datetime
    dataset_last_updated: Optional[datetime] = None
    owners: List[int] = []
    tags: List[str] = []
    # Agricultural research context fields
    geographic_location: Optional[str] = None
    data_time_period: Optional[str] = None
    # Approval fields
    approval_status: Optional[str] = None  # "pending", "approved", "rejected"
    approved_by: Optional[int] = None
    approved_by_name: Optional[str] = None
    approval_date: Optional[datetime] = None
    # File information
    file_types: List[str] = []  # e.g., ["csv", "json", "pdf"]

    class Config:
        from_attributes = True


class DatasetDetailResponse(DatasetResponse):
    """Extended dataset response with more details"""
    owner_details: List[DatasetOwnerResponse] = []
    tag_details: List[DatasetTagResponse] = []
    file_count: int = 0
    total_size: Optional[int] = None  # Total size in bytes


class DatasetListResponse(BaseModel):
    """Response for paginated dataset lists"""
    datasets: List[DatasetResponse]
    total_count: int
    page: int
    limit: int
    has_next: bool
    has_prev: bool


class DatasetFileResponse(BaseModel):
    """Response for dataset files"""
    file_id: int
    file_name: str
    size: Optional[int] = None
    file_type: Optional[str] = None
    file_date_of_upload: datetime
    file_url: str
    dataset_id: int

    class Config:
        from_attributes = True


class BatchDeleteResponse(BaseModel):
    """Response for batch delete operations"""
    message: str
    deleted_count: int
    errors: List[dict] = []


class DatasetStatsResponse(BaseModel):
    """Response for dataset statistics"""
    total_datasets: int
    total_downloads: int
    datasets_this_month: int
    top_tags: List[dict] = []  # [{"tag": "name", "count": 10}, ...]


class PublicStatsResponse(BaseModel):
    """Response for public homepage statistics"""
    total_datasets: int
    total_researchers: int  # Users who have uploaded at least one dataset
    total_downloads: int


class OwnerActionResponse(BaseModel):
    """Response for owner add/remove operations"""
    message: str
    dataset_id: int
    user_id: int 