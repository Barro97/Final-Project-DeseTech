from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, validator


class UserSearchRequest(BaseModel):
    """Request schema for user search with filters"""
    search_term: Optional[str] = Field(None, max_length=100)
    roles: Optional[List[str]] = Field(None, max_items=5)
    organizations: Optional[List[str]] = Field(None, max_items=10)
    skills: Optional[List[str]] = Field(None, max_items=20)
    status: Optional[List[str]] = Field(None, max_items=3)
    has_datasets: Optional[bool] = None
    min_datasets: Optional[int] = Field(None, ge=0)
    profile_completeness: Optional[str] = Field(None, pattern="^(basic|intermediate|complete)$")
    sort_by: Optional[str] = Field("relevance", pattern="^(relevance|name|recent|datasets|activity)$")
    page: int = Field(1, ge=1)
    limit: int = Field(20, ge=1, le=100)

    @validator('search_term')
    def validate_search_term(cls, v):
        if v:
            return v.strip()
        return v

    @validator('roles')
    def validate_roles(cls, v):
        if v:
            valid_roles = ['admin', 'moderator', 'researcher', 'student']
            return [role.lower() for role in v if role.lower() in valid_roles]
        return v

    @validator('status')
    def validate_status(cls, v):
        if v:
            valid_statuses = ['active', 'inactive', 'suspended']
            return [status.lower() for status in v if status.lower() in valid_statuses]
        return v


class UserSearchResponse(BaseModel):
    """Response schema for individual user in search results"""
    user_id: int
    username: str
    full_name: str
    email: str  # Only shown based on privacy settings
    role_name: Optional[str] = None
    status: str
    organization: Optional[str] = None
    bio: Optional[str] = None
    profile_picture_url: Optional[str] = None
    dataset_count: int = 0
    profile_completeness: str  # "basic", "intermediate", "complete"
    last_activity: Optional[datetime] = None
    skills: List[str] = []
    is_verified: bool = False

    class Config:
        from_attributes = True


class UserSearchListResponse(BaseModel):
    """Response for paginated user search results"""
    users: List[UserSearchResponse]
    total_count: int
    page: int
    limit: int
    has_next: bool
    has_prev: bool


class UserSearchSuggestion(BaseModel):
    """Individual search suggestion for users"""
    suggestion: str
    type: str  # "name", "organization", "skill"
    count: int  # Number of users matching this suggestion


class UserSearchSuggestionsResponse(BaseModel):
    """Response for user search suggestions"""
    suggestions: List[str]  # Simplified list of suggestion strings 