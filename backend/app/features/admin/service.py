"""
Admin Service Layer - Business Logic and Orchestration

This module provides the core business logic for admin operations, serving as the
orchestration layer between the API endpoints and the data access layer.

Key Features:
- Dataset approval workflow management
- User management and role assignment
- Admin dashboard statistics and analytics
- Audit trail management
- Comprehensive error handling and validation

The service follows the Repository Pattern for data access and implements
proper transaction management, logging, and error handling throughout.
"""

import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.database.models import User, Dataset, File
from backend.app.features.admin.repository import AdminRepositoryInterface, AdminRepository
from backend.app.features.dataset.repository import DatasetRepository
from backend.app.features.admin.schemas.request import (
    DatasetApprovalRequest, UserRoleUpdateRequest, UserStatusUpdateRequest,
    AdminFilterRequest
)
from backend.app.features.admin.schemas.response import (
    DatasetApprovalResponse, UserManagementResponse, AdminStatsResponse, 
    AdminDatasetResponse, AdminListResponse, RoleListResponse,
    AdminUserResponse
)
from backend.app.features.admin.exceptions import (
    AdminPermissionError, UserNotFoundError, AdminValidationError, AdminActionError,
    DatasetAlreadyProcessedError, RoleNotFoundError
)
from backend.app.features.dataset.exceptions import DatasetNotFoundError

# Initialize logger for this module
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
        
        Combines basic statistics with enhanced analytics including:
        - Geographic distribution analysis
        - Research domain trends
        - Organization collaboration patterns
        - Data quality metrics
        - Enhanced download analytics
        - Approval performance metrics
        - Collaboration patterns
        
        Args:
            db: Database session
            admin_user_id: ID of admin requesting stats
            
        Returns:
            AdminStatsResponse: Comprehensive dashboard statistics and metrics
        """
        # Validate admin permissions
        self._check_admin_permission(db, admin_user_id)
        
        # Get basic statistics (essential - no error handling)
        dataset_stats = self.repository.get_dataset_statistics(db)
        user_stats = self.repository.get_user_statistics(db)
        
        # Get enhanced analytics with error handling and fallbacks
        def safe_get_analytics(method_name, fallback_data):
            try:
                method = getattr(self.repository, method_name)
                return method(db)
            except Exception as e:
                logger.warning(f"Failed to get {method_name}: {str(e)}")
                return fallback_data
        
        geographic_analytics = safe_get_analytics('get_geographic_distribution', {
            "geotagged_datasets": 0,
            "total_approved_datasets": dataset_stats.get("approved_datasets", 0),
            "geographic_coverage_percentage": 0,
            "top_locations": [],
            "unique_locations": 0
        })
        
        research_domain_analytics = safe_get_analytics('get_research_domain_analytics', {
            "popular_domains": [],
            "trending_domains": [],
            "total_research_domains": 0,
            "tagged_datasets": 0
        })
        
        organization_analytics = safe_get_analytics('get_organization_analytics', {
            "top_contributing_organizations": [],
            "organizations_by_users": [],
            "unique_organizations": 0,
            "organization_coverage_percentage": 0,
            "users_with_organization": 0
        })
        
        quality_metrics = safe_get_analytics('get_data_quality_metrics', {
            "total_approved_datasets": dataset_stats.get("approved_datasets", 0),
            "geographic_completeness": {"count": 0, "percentage": 0},
            "temporal_completeness": {"count": 0, "percentage": 0},
            "tag_completeness": {"count": 0, "percentage": 0},
            "description_completeness": {"count": 0, "percentage": 0},
            "complete_metadata": {"count": 0, "percentage": 0},
            "quality_score": 0
        })
        
        download_analytics = safe_get_analytics('get_enhanced_download_analytics', {
            "unique_download_relationships": 0,
            "total_download_events": dataset_stats.get("total_downloads", 0),
            "abuse_prevention_ratio": 0,
            "popular_datasets": [],
            "average_downloads_per_user": 0,
            "recent_downloads_30d": 0,
            "download_conversion_rate": 0,
            "datasets_with_downloads": 0
        })
        
        approval_metrics = safe_get_analytics('get_approval_performance_metrics', {
            "pending_datasets": dataset_stats.get("pending_datasets", 0),
            "oldest_pending_days": 0,
            "approval_rate_30d": 0,
            "recent_approved": 0,
            "recent_rejected": 0,
            "average_approval_time_days": 0,
            "admin_activity_30d": []
        })
        
        collaboration_patterns = safe_get_analytics('get_collaboration_patterns', {
            "multi_owner_datasets": 0,
            "collaboration_rate": 0,
            "average_owners_per_dataset": 0,
            "cross_organizational_datasets": 0,
            "cross_org_collaboration_rate": 0,
            "most_collaborative_organizations": []
        })
        
        # Get recent audit trail for activity display with error handling
        try:
            recent_audit, _ = self.repository.get_audit_trail(db, page=1, limit=10)
            recent_activity = [
                {
                    "id": audit.audit_id,
                    "action": f"{audit.action_type.title()} {audit.target_type}",
                    "timestamp": audit.timestamp.isoformat(),
                    "details": f"Admin: {audit.admin_user.username if audit.admin_user else 'Unknown'}"
                }
                for audit in recent_audit
            ]
        except Exception as e:
            logger.warning(f"Failed to get recent activity: {str(e)}")
            recent_activity = []
        
        # Combine all analytics into comprehensive response
        return AdminStatsResponse(
            # Basic statistics
            total_users=user_stats["total_users"],
            active_users=user_stats["active_users"],
            total_datasets=dataset_stats["total_datasets"],
            pending_datasets=dataset_stats["pending_datasets"],
            approved_datasets=dataset_stats["approved_datasets"],
            rejected_datasets=dataset_stats["rejected_datasets"],
            total_downloads=dataset_stats["total_downloads"],
            datasets_this_month=dataset_stats["datasets_this_month"],
            users_this_month=user_stats["users_this_month"],
            
            # Enhanced analytics
            geographic_analytics=geographic_analytics,
            research_domain_analytics=research_domain_analytics,
            organization_analytics=organization_analytics,
            data_quality_metrics=quality_metrics,
            download_analytics=download_analytics,
            approval_performance=approval_metrics,
            collaboration_patterns=collaboration_patterns,
            
            # Activity data
            recent_activity=recent_activity,
            popular_categories=[
                {"category": domain["domain"], "count": domain["dataset_count"]}
                for domain in research_domain_analytics.get("popular_domains", [])[:6]
            ]
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

    def delete_user(self, db: Session, user_id: int, admin_user_id: int) -> UserManagementResponse:
        """
        Delete a user from the system with comprehensive data cleanup.
        
        This method handles the complete user deletion workflow including:
        1. Admin permission validation
        2. Prevention of self-deletion
        3. Comprehensive data cleanup (datasets, files, comments, likes)
        4. File deletion from storage
        5. Audit trail logging
        6. Complete user removal
        
        BUSINESS RULES:
        - Only admins can delete users
        - Admins cannot delete themselves
        - All user data is completely removed (datasets, files, comments, etc.)
        - Files are deleted from both database and storage
        - Audit trails are preserved for compliance
        
        Args:
            db: Database session for transaction
            user_id: ID of user to delete
            admin_user_id: ID of admin performing the deletion
            
        Returns:
            UserManagementResponse: Result of deletion operation
            
        Raises:
            AdminPermissionError: If user lacks admin permissions
            UserNotFoundError: If target user doesn't exist
            AdminValidationError: If trying to delete self or other validation fails
        """
        try:
            # STEP 1: Validate admin permissions
            admin_user = self._check_admin_permission(db, admin_user_id)
            
            # STEP 2: Prevent self-deletion
            if user_id == admin_user_id:
                raise AdminValidationError("Cannot delete your own account")
            
            # STEP 3: Get target user and validate existence
            target_user = db.query(User).filter(User.user_id == user_id).first()
            if not target_user:
                raise UserNotFoundError(user_id)
            
            # STEP 4: Get all files that will be deleted for storage cleanup
            user_datasets = db.query(Dataset).filter(Dataset.uploader_id == user_id).all()
            files_to_delete = []
            for dataset in user_datasets:
                dataset_files = db.query(File).filter(File.dataset_id == dataset.dataset_id).all()
                files_to_delete.extend(dataset_files)
            
            # STEP 5: Store comprehensive user information for audit logging
            dataset_count = len(user_datasets)
            file_count = len(files_to_delete)
            
            user_info = {
                "deleted_user_id": user_id,
                "deleted_username": target_user.username,
                "deleted_email": target_user.email,
                "deleted_role": target_user.role.role_name if target_user.role else "no_role",
                "admin_performing_deletion": admin_user.username,
                "datasets_deleted": dataset_count,
                "files_deleted": file_count,
                "deletion_timestamp": datetime.now().isoformat()
            }
            
            # STEP 6: Delete files from storage before database deletion
            failed_file_deletions = []
            if files_to_delete:
                try:
                    from backend.app.features.file.utils.upload import delete_file_from_storage
                    for file_obj in files_to_delete:
                        try:
                            if file_obj.file_url:
                                delete_file_from_storage(file_obj.file_url)
                        except Exception as file_err:
                            logger.warning(f"Failed to delete file {file_obj.file_name} from storage: {str(file_err)}")
                            failed_file_deletions.append(file_obj.file_name)
                except ImportError:
                    logger.warning("File storage deletion utility not available - files may remain in storage")
            
            # STEP 7: Delete user and all related data (handled by repository)
            success = self.repository.delete_user(db, user_id)
            if not success:
                raise AdminActionError("Failed to delete user from database")
            
            # STEP 8: Log admin action for audit trail (include file deletion info)
            if failed_file_deletions:
                user_info["failed_file_deletions"] = failed_file_deletions
                user_info["storage_cleanup_status"] = "partial"
            else:
                user_info["storage_cleanup_status"] = "complete"
            
            self.repository.log_admin_action(
                db=db,
                admin_user_id=admin_user_id,
                action_type="user_deletion",
                target_type="user",
                target_id=user_id,
                details=user_info
            )
            
            # STEP 9: Commit transaction
            db.commit()
            
            logger.info(f"User {user_id} ({target_user.username}) completely deleted by admin {admin_user_id} - {dataset_count} datasets, {file_count} files removed")
            
            # Prepare response message
            success_message = f"User '{target_user.username}' has been completely deleted"
            if dataset_count > 0:
                success_message += f" along with {dataset_count} datasets and {file_count} files"
            if failed_file_deletions:
                success_message += f" (Note: {len(failed_file_deletions)} files may remain in storage)"
            
            return UserManagementResponse(
                user_id=user_id,
                action="delete",
                success=True,
                message=success_message,
                updated_fields={
                    "status": "deleted",
                    "datasets_deleted": dataset_count,
                    "files_deleted": file_count
                }
            )
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error deleting user {user_id}: {str(e)}")
            raise 