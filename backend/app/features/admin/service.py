"""
Admin Service Layer - Business Logic and Transaction Management

This module implements the Service Layer Pattern for admin operations, providing:
- Centralized business logic for admin functionality
- Transaction management with proper rollback handling
- Permission checking and validation
- Audit logging for compliance
- Integration with repository layer for data access

Following the established dataset service pattern for consistency and maintainability.

ADMIN BUSINESS LOGIC:
├── **Dataset Approval Workflow**: Approve/reject datasets with proper status updates
├── **User Management**: Role updates, status changes, user creation
├── **Analytics and Statistics**: Dashboard metrics and reporting
├── **Audit Trail**: Comprehensive logging of all admin actions
└── **Permission Enforcement**: Admin-only access with role validation

TRANSACTION MANAGEMENT:
- All operations wrapped in database transactions
- Automatic rollback on errors
- Audit logging within same transaction for consistency
"""
import logging
from datetime import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from backend.app.features.admin.repository import AdminRepository, AdminRepositoryInterface
from backend.app.features.admin.schemas.request import (
    DatasetApprovalRequest, UserRoleUpdateRequest, UserStatusUpdateRequest,
    UserCreateRequest, AdminFilterRequest, BatchActionRequest
)
from backend.app.features.admin.schemas.response import (
    DatasetApprovalResponse, UserManagementResponse, AdminStatsResponse,
    AdminUserResponse, AdminDatasetResponse, AdminListResponse,
    BatchActionResponse, RoleListResponse
)
from backend.app.features.admin.exceptions import (
    AdminError, AdminPermissionError, UserNotFoundError, RoleNotFoundError,
    AdminValidationError, AdminActionError, DatasetAlreadyProcessedError
)
from backend.app.features.dataset.repository import DatasetRepository
from backend.app.database.models import Dataset, User
from backend.app.features.user.models import Role

logger = logging.getLogger(__name__)


class AdminService:
    """
    Service layer for admin operations following established patterns.
    
    This service handles all admin-related business logic including dataset approval,
    user management, statistics generation, and audit logging. It ensures proper
    transaction management and permission checking for all admin operations.
    
    DESIGN PRINCIPLES:
    - **Transaction Safety**: All operations wrapped in proper transactions
    - **Permission Enforcement**: Admin role validation on all operations
    - **Audit Logging**: Comprehensive logging of admin actions
    - **Error Handling**: Typed exceptions with proper HTTP mapping
    - **Business Logic Encapsulation**: All admin rules centralized in service layer
    """

    def __init__(self, repository: AdminRepositoryInterface = None):
        """
        Initialize the admin service with dependency injection support.
        
        Args:
            repository: Admin repository implementation (defaults to AdminRepository)
        """
        self.repository = repository or AdminRepository()
        self.dataset_repository = DatasetRepository()

    def _check_admin_permission(self, db: Session, user_id: int) -> User:
        """
        Verify that the user has admin permissions.
        
        Args:
            db: Database session
            user_id: ID of user to check
            
        Returns:
            User: The admin user if permissions are valid
            
        Raises:
            AdminPermissionError: If user is not an admin
        """
        user = db.query(User).join(User.role).filter(User.user_id == user_id).first()
        if not user:
            raise AdminPermissionError("User not found")
        
        if not user.role or user.role.role_name.lower() != 'admin':
            raise AdminPermissionError("Admin permissions required")
        
        return user

    def approve_dataset(self, db: Session, dataset_id: int, approval_request: DatasetApprovalRequest, 
                       admin_user_id: int) -> DatasetApprovalResponse:
        """
        Approve or reject a dataset with proper workflow and audit logging.
        
        This method handles the complete dataset approval workflow:
        1. Validates admin permissions
        2. Checks dataset exists and current status
        3. Updates approval status and metadata
        4. Logs action to audit trail
        5. Returns structured response
        
        Args:
            db: Database session for transaction
            dataset_id: ID of dataset to approve/reject
            approval_request: Approval action details
            admin_user_id: ID of admin performing action
            
        Returns:
            DatasetApprovalResponse: Result of approval action
            
        Raises:
            AdminPermissionError: If user lacks admin permissions
            DatasetNotFoundError: If dataset doesn't exist
            DatasetAlreadyProcessedError: If dataset already approved/rejected
        """
        try:
            # STEP 1: Validate admin permissions
            admin_user = self._check_admin_permission(db, admin_user_id)
            
            # STEP 2: Get and validate dataset
            dataset = self.dataset_repository.get_by_id(db, dataset_id)
            if not dataset:
                from backend.app.features.dataset.exceptions import DatasetNotFoundError
                raise DatasetNotFoundError(dataset_id)
            
            # STEP 3: Check current approval status
            if dataset.approval_status != 'pending':
                raise DatasetAlreadyProcessedError(dataset_id, dataset.approval_status)
            
            # STEP 4: Update dataset approval status
            new_status = 'approved' if approval_request.action == 'approve' else 'rejected'
            approval_date = datetime.now()
            
            updates = {
                'approval_status': new_status,
                'approved_by': admin_user_id,
                'approval_date': approval_date,
                'dataset_last_updated': approval_date
            }
            
            updated_dataset = self.dataset_repository.update(db, dataset_id, updates)
            
            # STEP 5: Log admin action for audit trail
            action_details = {
                "action": approval_request.action,
                "dataset_id": dataset_id,
                "dataset_name": dataset.dataset_name,
                "previous_status": "pending",
                "new_status": new_status
            }
            if approval_request.reason:
                action_details["reason"] = approval_request.reason
            
            self.repository.log_admin_action(
                db=db,
                admin_user_id=admin_user_id,
                action_type=f"dataset_{approval_request.action}",
                target_type="dataset",
                target_id=dataset_id,
                details=action_details
            )
            
            # STEP 6: Commit transaction
            db.commit()
            
            logger.info(f"Dataset {dataset_id} {approval_request.action}d by admin {admin_user_id}")
            
            return DatasetApprovalResponse(
                dataset_id=dataset_id,
                action=approval_request.action,
                approved_by=admin_user_id,
                approval_date=approval_date,
                message=f"Dataset successfully {approval_request.action}d"
            )
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error in dataset approval: {str(e)}")
            raise

    def get_pending_datasets(self, db: Session, admin_user_id: int, limit: int = 50) -> List[AdminDatasetResponse]:
        """
        Get all datasets pending approval for admin review.
        
        Args:
            db: Database session
            admin_user_id: ID of admin requesting data
            limit: Maximum number of datasets to return
            
        Returns:
            List[AdminDatasetResponse]: Pending datasets with metadata
        """
        # Validate admin permissions
        self._check_admin_permission(db, admin_user_id)
        
        # Get pending datasets
        pending_datasets = self.repository.get_pending_datasets(db, limit)
        
        # Convert to response format
        responses = []
        for dataset in pending_datasets:
            response = AdminDatasetResponse(
                dataset_id=dataset.dataset_id,
                dataset_name=dataset.dataset_name,
                dataset_description=dataset.dataset_description,
                uploader_id=dataset.uploader_id,
                uploader_name=f"{dataset.uploader.first_name} {dataset.uploader.last_name}" if dataset.uploader.first_name else dataset.uploader.username,
                date_of_creation=dataset.date_of_creation,
                approval_status=dataset.approval_status,
                approved_by=dataset.approved_by,
                approval_date=dataset.approval_date,
                downloads_count=dataset.downloads_count,
                file_count=len(dataset.files) if dataset.files else 0
            )
            responses.append(response)
        
        return responses

    def get_users_for_management(self, db: Session, admin_user_id: int, 
                                filters: AdminFilterRequest) -> AdminListResponse:
        """
        Get filtered users for admin management interface.
        
        Args:
            db: Database session
            admin_user_id: ID of admin requesting data
            filters: Filter and pagination parameters
            
        Returns:
            AdminListResponse: Paginated user list with metadata
        """
        # Validate admin permissions
        self._check_admin_permission(db, admin_user_id)
        
        # Get filtered users
        users, total_count = self.repository.get_users_with_filters(db, filters)
        
        # Convert to response format
        user_responses = []
        for user in users:
            # Count datasets for this user
            dataset_count = db.query(Dataset).filter(Dataset.uploader_id == user.user_id).count()
            
            user_response = AdminUserResponse(
                user_id=user.user_id,
                email=user.email,
                username=user.username,
                first_name=user.first_name,
                last_name=user.last_name,
                role_name=user.role.role_name if user.role else None,
                status=user.status,
                last_login=user.last_login,
                created_by=user.created_by,
                dataset_count=dataset_count
            )
            user_responses.append(user_response)
        
        return AdminListResponse(
            items=[user.__dict__ for user in user_responses],
            total_count=total_count,
            page=filters.page,
            limit=filters.limit,
            has_next=(filters.page * filters.limit) < total_count,
            has_prev=filters.page > 1
        )

    def update_user_role(self, db: Session, role_request: UserRoleUpdateRequest, 
                        admin_user_id: int) -> UserManagementResponse:
        """
        Update a user's role with proper validation and audit logging.
        
        Args:
            db: Database session
            role_request: Role update request details
            admin_user_id: ID of admin performing action
            
        Returns:
            UserManagementResponse: Result of role update
        """
        try:
            # Validate admin permissions
            self._check_admin_permission(db, admin_user_id)
            
            # Get target user
            user = db.query(User).filter(User.user_id == role_request.user_id).first()
            if not user:
                raise UserNotFoundError(role_request.user_id)
            
            # Get new role
            role = self.repository.get_role_by_name(db, role_request.role_name)
            if not role:
                raise RoleNotFoundError(role_request.role_name)
            
            # Prevent admin from removing their own admin role
            if user.user_id == admin_user_id and role_request.role_name != 'admin':
                raise AdminValidationError("Cannot remove your own admin privileges")
            
            # Update user role
            old_role_name = user.role.role_name if user.role else "none"
            success = self.repository.update_user_role(db, role_request.user_id, role.role_id)
            
            if not success:
                raise AdminActionError("Failed to update user role")
            
            # Log admin action
            audit_details = {
                "action": "role_update",
                "user_id": role_request.user_id,
                "user_email": user.email,
                "previous_role": old_role_name,
                "new_role": role_request.role_name
            }
            
            self.repository.log_admin_action(
                db=db,
                admin_user_id=admin_user_id,
                action_type="user_role_update",
                target_type="user",
                target_id=role_request.user_id,
                details=audit_details
            )
            
            db.commit()
            
            return UserManagementResponse(
                user_id=role_request.user_id,
                action="role_update",
                success=True,
                message=f"User role updated to {role_request.role_name}",
                updated_fields={"role_name": role_request.role_name}
            )
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error updating user role: {str(e)}")
            raise

    def get_admin_dashboard_stats(self, db: Session, admin_user_id: int) -> AdminStatsResponse:
        """
        Generate comprehensive statistics for admin dashboard.
        
        Args:
            db: Database session
            admin_user_id: ID of admin requesting stats
            
        Returns:
            AdminStatsResponse: Dashboard statistics and metrics
        """
        # Validate admin permissions
        self._check_admin_permission(db, admin_user_id)
        
        # Get dataset statistics
        dataset_stats = self.repository.get_dataset_statistics(db)
        
        # Get user statistics
        user_stats = self.repository.get_user_statistics(db)
        
        # Combine and return comprehensive stats
        return AdminStatsResponse(
            total_users=user_stats["total_users"],
            active_users=user_stats["active_users"],
            total_datasets=dataset_stats["total_datasets"],
            pending_datasets=dataset_stats["pending_datasets"],
            approved_datasets=dataset_stats["approved_datasets"],
            rejected_datasets=dataset_stats["rejected_datasets"],
            total_downloads=dataset_stats["total_downloads"],
            datasets_this_month=dataset_stats["datasets_this_month"],
            users_this_month=user_stats["users_this_month"],
            recent_activity=[],  # To be implemented with audit trail
            popular_categories=[]  # To be implemented with tag analysis
        )

    def get_available_roles(self, db: Session, admin_user_id: int) -> List[RoleListResponse]:
        """
        Get all available roles in the system.
        
        Args:
            db: Database session
            admin_user_id: ID of admin requesting roles
            
        Returns:
            List[RoleListResponse]: Available roles with user counts
        """
        # Validate admin permissions
        self._check_admin_permission(db, admin_user_id)
        
        # Get all roles
        roles = self.repository.get_all_roles(db)
        
        # Convert to response format with user counts
        role_responses = []
        for role in roles:
            user_count = db.query(User).filter(User.role_id == role.role_id).count()
            role_response = RoleListResponse(
                role_id=role.role_id,
                role_name=role.role_name,
                user_count=user_count
            )
            role_responses.append(role_response)
        
        return role_responses 