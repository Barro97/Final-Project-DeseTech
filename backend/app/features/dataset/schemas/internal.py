from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class DatasetCreateInternal(BaseModel):
    """Internal model for dataset creation"""
    dataset_name: str
    dataset_description: Optional[str] = None
    uploader_id: int
    tags: List[str] = []
    geographic_location: Optional[str] = None
    data_time_period: Optional[str] = None


class DatasetUpdateInternal(BaseModel):
    """Internal model for dataset updates"""
    dataset_name: Optional[str] = None
    dataset_description: Optional[str] = None
    tags: Optional[List[str]] = None
    dataset_last_updated: datetime = None
    geographic_location: Optional[str] = None
    data_time_period: Optional[str] = None


class DatasetFilterInternal(BaseModel):
    """Internal model for dataset filtering"""
    search_term: Optional[str] = None
    tags: Optional[List[str]] = None
    uploader_id: Optional[int] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    sort_by: str = "newest"
    offset: int = 0
    limit: int = 20
    # Admin filtering options
    include_approval_status: Optional[List[str]] = None  # ['pending', 'approved', 'rejected']
    is_admin_request: bool = False  # Indicates if request comes from admin
    
    # Tier 1 filters
    file_types: Optional[List[str]] = None
    has_location: Optional[bool] = None
    min_downloads: Optional[int] = None
    max_downloads: Optional[int] = None


class BatchDeleteResult(BaseModel):
    """Internal model for batch delete results"""
    deleted_count: int
    errors: List[dict] = []
    successful_ids: List[int] = []
    failed_ids: List[int] = [] 