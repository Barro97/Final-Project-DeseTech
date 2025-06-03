from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class AdminUserResponse(BaseModel):
    """Response schema for user information in admin context"""
    user_id: int
    email: str
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role_name: Optional[str] = None
    status: str = "active"
    last_login: Optional[datetime] = None
    created_by: Optional[int] = None
    dataset_count: int = 0

    class Config:
        from_attributes = True


class AdminDatasetResponse(BaseModel):
    """Response schema for dataset information in admin context"""
    dataset_id: int
    dataset_name: str
    dataset_description: Optional[str] = None
    uploader_id: int
    uploader_name: Optional[str] = None
    date_of_creation: datetime
    approval_status: str = "pending"
    approved_by: Optional[int] = None
    approval_date: Optional[datetime] = None
    downloads_count: int = 0
    file_count: int = 0

    class Config:
        from_attributes = True


class DatasetApprovalResponse(BaseModel):
    """Response schema for dataset approval actions"""
    dataset_id: int
    action: str
    approved_by: int
    approval_date: datetime
    message: str


class UserManagementResponse(BaseModel):
    """Response schema for user management actions"""
    user_id: int
    action: str
    success: bool
    message: str
    updated_fields: Optional[Dict[str, Any]] = None


class AdminStatsResponse(BaseModel):
    """Response schema for admin dashboard statistics"""
    total_users: int
    active_users: int
    total_datasets: int
    pending_datasets: int
    approved_datasets: int
    rejected_datasets: int
    total_downloads: int
    datasets_this_month: int
    users_this_month: int
    recent_activity: List[Dict[str, Any]] = []
    popular_categories: List[Dict[str, Any]] = []


class AdminAuditResponse(BaseModel):
    """Response schema for admin audit trail"""
    audit_id: int
    admin_user_id: int
    admin_username: Optional[str] = None
    action_type: str
    target_type: str
    target_id: int
    action_details: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True


class AdminListResponse(BaseModel):
    """Response schema for paginated admin lists"""
    items: List[Dict[str, Any]]
    total_count: int
    page: int
    limit: int
    has_next: bool
    has_prev: bool


class BatchActionResponse(BaseModel):
    """Response schema for batch admin actions"""
    action_type: str
    total_requested: int
    successful_count: int
    failed_count: int
    successful_ids: List[int] = []
    failed_items: List[Dict[str, Any]] = []
    message: str


class RoleListResponse(BaseModel):
    """Response schema for available roles"""
    role_id: int
    role_name: str
    user_count: int = 0

    class Config:
        from_attributes = True 