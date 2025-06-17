from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, validator


class DatasetApprovalRequest(BaseModel):
    """Request schema for approving or rejecting datasets"""
    action: str = Field(..., pattern="^(approve|reject)$")

    @validator('action')
    def validate_action(cls, v):
        if v not in ['approve', 'reject']:
            raise ValueError('Action must be either "approve" or "reject"')
        return v


class UserRoleUpdateRequest(BaseModel):
    """Request schema for updating user roles"""
    user_id: int = Field(..., gt=0)
    role_name: str = Field(..., min_length=1, max_length=50)

    @validator('role_name')
    def validate_role_name(cls, v):
        allowed_roles = ['admin', 'user', 'moderator']
        if v.lower() not in allowed_roles:
            raise ValueError(f'Role must be one of: {", ".join(allowed_roles)}')
        return v.lower()


class UserStatusUpdateRequest(BaseModel):
    """Request schema for updating user status"""
    user_id: int = Field(..., gt=0)
    status: str = Field(..., pattern="^(active|inactive|suspended)$")

    @validator('status')
    def validate_status(cls, v):
        if v not in ['active', 'inactive', 'suspended']:
            raise ValueError('Status must be "active", "inactive", or "suspended"')
        return v


class UserCreateRequest(BaseModel):
    """Request schema for admin creating new users"""
    email: str = Field(..., min_length=1, max_length=255)
    username: str = Field(..., min_length=3, max_length=255)
    first_name: Optional[str] = Field(None, max_length=255)
    last_name: Optional[str] = Field(None, max_length=255)
    password: str = Field(..., min_length=8, max_length=255)
    role_name: str = Field(default="user", max_length=50)

    @validator('email')
    def validate_email(cls, v):
        if '@' not in v:
            raise ValueError('Invalid email format')
        return v.lower()

    @validator('username')
    def validate_username(cls, v):
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Username can only contain letters, numbers, hyphens, and underscores')
        return v.lower()


class AdminFilterRequest(BaseModel):
    """Request schema for admin filtering and search"""
    search_term: Optional[str] = Field(None, max_length=100)
    status_filter: Optional[str] = Field(None, pattern="^(pending|approved|rejected|active|inactive|suspended)$")
    role_filter: Optional[str] = Field(None, max_length=50)
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    page: int = Field(1, ge=1)
    limit: int = Field(20, ge=1, le=100)


class BatchActionRequest(BaseModel):
    """Request schema for batch admin actions"""
    target_ids: List[int] = Field(..., min_items=1, max_items=50)
    action_type: str = Field(..., max_length=50)
    action_data: Optional[dict] = None

    @validator('target_ids')
    def validate_target_ids(cls, v):
        if len(set(v)) != len(v):
            raise ValueError('Duplicate IDs are not allowed')
        return v 