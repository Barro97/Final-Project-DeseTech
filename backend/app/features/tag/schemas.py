from pydantic import BaseModel, Field, validator
from typing import List

class TagBase(BaseModel):
    tag_category_name: str = Field(..., min_length=1, max_length=255)
    
    @validator('tag_category_name')
    def validate_tag_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Tag name cannot be empty')
        # Remove extra spaces and convert to lowercase for consistency
        cleaned = v.strip().lower()
        if len(cleaned) < 1:
            raise ValueError('Tag name must contain at least one character')
        return cleaned

class TagCreate(TagBase):
    pass

class TagUpdate(BaseModel):
    tag_category_name: str = Field(..., min_length=1, max_length=255)
    
    @validator('tag_category_name')
    def validate_tag_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Tag name cannot be empty')
        # Remove extra spaces and convert to lowercase for consistency
        cleaned = v.strip().lower()
        if len(cleaned) < 1:
            raise ValueError('Tag name must contain at least one character')
        return cleaned

class Tag(TagBase):
    tag_id: int

    class Config:
        from_attributes = True

class TagList(BaseModel):
    """Response schema for listing all tags"""
    tags: List[Tag]
    total_count: int