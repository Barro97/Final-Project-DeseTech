from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, validator
from backend.app.features.dataset.utils import validate_dataset_name, validate_dataset_description


class DatasetCreateRequest(BaseModel):
    dataset_name: str = Field(..., min_length=3, max_length=200)
    dataset_description: Optional[str] = Field(None, max_length=2000)
    uploader_id: int = Field(..., gt=0)
    tags: List[str] = Field(default_factory=list, max_items=20)
    # Agricultural research context fields (optional but recommended)
    geographic_location: Optional[str] = Field(None, max_length=500)
    data_time_period: Optional[str] = Field(None, max_length=100)

    @validator('dataset_name')
    def validate_name(cls, v):
        return validate_dataset_name(v)

    @validator('dataset_description')
    def validate_description(cls, v):
        return validate_dataset_description(v)

    @validator('geographic_location')
    def validate_geographic_location(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) > 500:
                raise ValueError('Geographic location cannot exceed 500 characters')
            return v if v else None
        return v

    @validator('data_time_period')
    def validate_data_time_period(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) > 100:
                raise ValueError('Data time period cannot exceed 100 characters')
            return v if v else None
        return v

    @validator('tags')
    def validate_tags(cls, v):
        if not isinstance(v, list):
            raise ValueError('Tags must be a list')
        # Filter out empty or invalid tags
        valid_tags = [tag.strip() for tag in v if tag and isinstance(tag, str) and len(tag.strip()) >= 2]
        return valid_tags[:20]  # Limit to 20 tags


class DatasetUpdateRequest(BaseModel):
    dataset_name: Optional[str] = Field(None, min_length=3, max_length=200)
    dataset_description: Optional[str] = Field(None, max_length=2000)
    tags: Optional[List[str]] = Field(None, max_items=20)
    # Agricultural research context fields (optional)
    geographic_location: Optional[str] = Field(None, max_length=500)
    data_time_period: Optional[str] = Field(None, max_length=100)

    @validator('dataset_name')
    def validate_name(cls, v):
        if v is not None:
            return validate_dataset_name(v)
        return v

    @validator('dataset_description')
    def validate_description(cls, v):
        if v is not None:
            return validate_dataset_description(v)
        return v

    @validator('geographic_location')
    def validate_geographic_location(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) > 500:
                raise ValueError('Geographic location cannot exceed 500 characters')
            return v if v else None
        return v

    @validator('data_time_period')
    def validate_data_time_period(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) > 100:
                raise ValueError('Data time period cannot exceed 100 characters')
            return v if v else None
        return v

    @validator('tags')
    def validate_tags(cls, v):
        if v is not None:
            if not isinstance(v, list):
                raise ValueError('Tags must be a list')
            valid_tags = [tag.strip() for tag in v if tag and isinstance(tag, str) and len(tag.strip()) >= 2]
            return valid_tags[:20]
        return v


class OwnerActionRequest(BaseModel):
    user_id: int = Field(..., gt=0)


class BatchDeleteRequest(BaseModel):
    dataset_ids: List[int] = Field(..., min_items=1, max_items=50)

    @validator('dataset_ids')
    def validate_dataset_ids(cls, v):
        if not v:
            raise ValueError('At least one dataset ID is required')
        if len(v) > 50:
            raise ValueError('Cannot delete more than 50 datasets at once')
        # Remove duplicates and ensure all are positive integers
        unique_ids = list(set([id for id in v if isinstance(id, int) and id > 0]))
        if not unique_ids:
            raise ValueError('No valid dataset IDs provided')
        return unique_ids


class DatasetFilterRequest(BaseModel):
    """Request schema for filtering datasets"""
    search_term: Optional[str] = Field(None, max_length=100)
    tags: Optional[List[str]] = Field(None, max_items=10)
    uploader_id: Optional[int] = Field(None, gt=0)
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    sort_by: Optional[str] = Field("newest", pattern="^(newest|oldest|downloads|name)$")
    page: int = Field(1, ge=1)
    limit: int = Field(20, ge=1, le=100)
    
    # Tier 1 filters
    file_types: Optional[List[str]] = Field(None, max_items=20)
    has_location: Optional[bool] = None
    min_downloads: Optional[int] = Field(None, ge=0)
    max_downloads: Optional[int] = Field(None, ge=0)
    
    # Approval status filter
    approval_status: Optional[List[str]] = Field(None, max_items=3)

    @validator('search_term')
    def validate_search_term(cls, v):
        if v:
            return v.strip()
        return v

    @validator('tags')
    def validate_filter_tags(cls, v):
        if v:
            return [tag.strip().lower() for tag in v if tag and isinstance(tag, str)]
        return v
    
    @validator('file_types')
    def validate_file_types(cls, v):
        if v:
            # Normalize file types to lowercase and remove empty strings
            return [ft.strip().lower() for ft in v if ft and isinstance(ft, str)]
        return v
    
    @validator('approval_status')
    def validate_approval_status(cls, v):
        if v:
            valid_statuses = ['pending', 'approved', 'rejected']
            return [status.strip().lower() for status in v if status and status.strip().lower() in valid_statuses]
        return v
    
    @validator('max_downloads')
    def validate_download_range(cls, v, values):
        if v is not None and 'min_downloads' in values and values['min_downloads'] is not None:
            if v < values['min_downloads']:
                raise ValueError('max_downloads must be greater than or equal to min_downloads')
        return v 