from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import logging

from backend.app.database.session import get_db
from backend.app.features.authentication.utils.authorizations import get_current_user
from backend.app.features.admin.service import AdminService
from backend.app.features.admin.schemas.request import (
    DatasetApprovalRequest, UserRoleUpdateRequest, UserStatusUpdateRequest,
    AdminFilterRequest
)
from backend.app.features.admin.schemas.response import (
    DatasetApprovalResponse, UserManagementResponse, AdminStatsResponse,
    AdminDatasetResponse, AdminListResponse, RoleListResponse
)
from backend.app.features.admin.exceptions import AdminError, handle_admin_exception

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["admin"])

# Initialize service
admin_service = AdminService()


@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get comprehensive statistics for admin dashboard."""
    try:
        return admin_service.get_admin_dashboard_stats(db, current_user["user_id"])
    except AdminError as e:
        raise handle_admin_exception(e)
    except Exception as e:
        logger.error(f"Unexpected error getting admin stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/datasets/pending", response_model=List[AdminDatasetResponse])
def get_pending_datasets(
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all datasets pending approval."""
    try:
        return admin_service.get_pending_datasets(db, current_user["user_id"], limit)
    except AdminError as e:
        raise handle_admin_exception(e)
    except Exception as e:
        logger.error(f"Unexpected error getting pending datasets: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/datasets/{dataset_id}/approve", response_model=DatasetApprovalResponse)
def approve_dataset(
    approval_request: DatasetApprovalRequest,
    dataset_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Approve or reject a dataset."""
    try:
        return admin_service.approve_dataset(db, dataset_id, approval_request, current_user["user_id"])
    except AdminError as e:
        raise handle_admin_exception(e)
    except Exception as e:
        logger.error(f"Unexpected error in dataset approval: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/users", response_model=AdminListResponse)
def get_users_for_management(
    search_term: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    role_filter: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get filtered users for admin management."""
    try:
        filters = AdminFilterRequest(
            search_term=search_term,
            status_filter=status_filter,
            role_filter=role_filter,
            page=page,
            limit=limit
        )
        return admin_service.get_users_for_management(db, current_user["user_id"], filters)
    except AdminError as e:
        raise handle_admin_exception(e)
    except Exception as e:
        logger.error(f"Unexpected error getting users: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/users/role", response_model=UserManagementResponse)
def update_user_role(
    role_request: UserRoleUpdateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update a user's role."""
    try:
        return admin_service.update_user_role(db, role_request, current_user["user_id"])
    except AdminError as e:
        raise handle_admin_exception(e)
    except Exception as e:
        logger.error(f"Unexpected error updating user role: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/roles", response_model=List[RoleListResponse])
def get_available_roles(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all available roles in the system."""
    try:
        return admin_service.get_available_roles(db, current_user["user_id"])
    except AdminError as e:
        raise handle_admin_exception(e)
    except Exception as e:
        logger.error(f"Unexpected error getting roles: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


# Health check endpoint for admin functionality
@router.get("/health")
def admin_health_check():
    """Health check endpoint for admin functionality."""
    return {"status": "healthy", "message": "Admin API is operational"} 