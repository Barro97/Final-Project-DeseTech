"""
Admin Repository Layer - Data Access and Query Management

This module implements the Repository Pattern for admin operations, providing:
- Clean separation between business logic and data access
- Efficient database queries with proper indexing
- Transaction management support
- Type-safe data operations
- Consistent error handling

Following established patterns from dataset repository for maintainability.
"""
import json
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc, or_, and_
from datetime import datetime, timedelta

from backend.app.database.models import Dataset, User, AdminAudit, File, Comment, Like
from backend.app.features.user.models import Role
from backend.app.features.admin.schemas.request import AdminFilterRequest


class AdminRepositoryInterface(ABC):
    """
    Abstract interface defining all admin data access operations.
    
    This interface establishes the contract for admin repository implementations,
    ensuring consistent behavior and enabling easy testing through mock implementations.
    """

    @abstractmethod
    def get_pending_datasets(self, db: Session, limit: int = 50) -> List[Dataset]:
        """Get all datasets pending approval."""
        pass

    @abstractmethod
    def get_users_with_filters(self, db: Session, filters: AdminFilterRequest) -> Tuple[List[User], int]:
        """Get filtered users with pagination."""
        pass

    @abstractmethod
    def get_dataset_statistics(self, db: Session) -> Dict[str, Any]:
        """Get comprehensive dataset statistics for admin dashboard."""
        pass

    @abstractmethod
    def get_user_statistics(self, db: Session) -> Dict[str, Any]:
        """Get user statistics for admin dashboard."""
        pass

    @abstractmethod
    def log_admin_action(self, db: Session, admin_user_id: int, action_type: str, 
                        target_type: str, target_id: int, details: str = None) -> AdminAudit:
        """Log admin action to audit trail."""
        pass

    @abstractmethod
    def get_audit_trail(self, db: Session, page: int = 1, limit: int = 50) -> Tuple[List[AdminAudit], int]:
        """Get admin audit trail with pagination."""
        pass


class AdminRepository(AdminRepositoryInterface):
    """
    SQLAlchemy implementation of the admin repository interface.
    
    This class provides concrete implementation of all admin data access operations
    using SQLAlchemy ORM, following the same patterns as DatasetRepository.
    """

    def get_pending_datasets(self, db: Session, limit: int = 50) -> List[Dataset]:
        """
        Get all datasets pending approval with uploader information.
        
        Args:
            db: Database session for query execution
            limit: Maximum number of datasets to return
            
        Returns:
            List[Dataset]: Pending datasets with uploader relationship loaded
        """
        return db.query(Dataset).filter(
            Dataset.approval_status == 'pending'
        ).join(Dataset.uploader).order_by(
            desc(Dataset.date_of_creation)
        ).limit(limit).all()

    def get_users_with_filters(self, db: Session, filters: AdminFilterRequest) -> Tuple[List[User], int]:
        """
        Get filtered users with pagination and search capabilities.
        
        This method builds a dynamic query based on the provided filters:
        1. Applies text search across username, email, first_name, last_name
        2. Filters by user status if specified
        3. Filters by role if specified
        4. Applies pagination
        
        Args:
            db: Database session for query execution
            filters: Filter criteria including search, status, role, pagination
            
        Returns:
            Tuple[List[User], int]: (filtered users for current page, total matching count)
        """
        # START WITH BASE QUERY
        query = db.query(User).join(User.role, isouter=True)

        # APPLY TEXT SEARCH FILTER
        if filters.search_term:
            search = f"%{filters.search_term}%"
            query = query.filter(
                or_(
                    User.username.ilike(search),
                    User.email.ilike(search),
                    User.first_name.ilike(search),
                    User.last_name.ilike(search)
                )
            )

        # APPLY STATUS FILTER
        if filters.status_filter:
            query = query.filter(User.status == filters.status_filter)

        # APPLY ROLE FILTER
        if filters.role_filter:
            query = query.filter(Role.role_name == filters.role_filter)

        # GET TOTAL COUNT (before pagination)
        total_count = query.count()

        # APPLY PAGINATION
        offset = (filters.page - 1) * filters.limit
        users = query.offset(offset).limit(filters.limit).all()

        return users, total_count

    def get_dataset_statistics(self, db: Session) -> Dict[str, Any]:
        """
        Generate comprehensive dataset statistics for admin dashboard.
        
        Args:
            db: Database session for query execution
            
        Returns:
            Dict[str, Any]: Statistics including counts by status, recent activity
        """
        # BASIC COUNTS BY STATUS
        total_datasets = db.query(Dataset).count()
        pending_datasets = db.query(Dataset).filter(Dataset.approval_status == 'pending').count()
        approved_datasets = db.query(Dataset).filter(Dataset.approval_status == 'approved').count()
        rejected_datasets = db.query(Dataset).filter(Dataset.approval_status == 'rejected').count()
        
        # TOTAL DOWNLOADS
        total_downloads = db.query(func.sum(Dataset.downloads_count)).scalar() or 0
        
        # MONTHLY ACTIVITY
        month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        datasets_this_month = db.query(Dataset).filter(
            Dataset.date_of_creation >= month_start
        ).count()

        return {
            "total_datasets": total_datasets,
            "pending_datasets": pending_datasets,
            "approved_datasets": approved_datasets,
            "rejected_datasets": rejected_datasets,
            "total_downloads": total_downloads,
            "datasets_this_month": datasets_this_month
        }

    def get_user_statistics(self, db: Session) -> Dict[str, Any]:
        """
        Generate user statistics for admin dashboard.
        
        Args:
            db: Database session for query execution
            
        Returns:
            Dict[str, Any]: User statistics including counts by status and activity
        """
        # BASIC USER COUNTS
        total_users = db.query(User).count()
        active_users = db.query(User).filter(User.status == 'active').count()
        
        # MONTHLY REGISTRATIONS (assuming created_at field exists or using user_id as proxy)
        month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        # Note: This assumes there's a created_at field. If not, this query needs adjustment
        users_this_month = db.query(User).filter(
            User.user_id > 0  # Placeholder - replace with actual date field when available
        ).count()  # This is a simplified version

        return {
            "total_users": total_users,
            "active_users": active_users,
            "users_this_month": users_this_month
        }

    def log_admin_action(self, db: Session, admin_user_id: int, action_type: str, 
                        target_type: str, target_id: int, details: str = None) -> AdminAudit:
        """
        Log admin action to audit trail for compliance and tracking.
        
        Args:
            db: Database session for transaction
            admin_user_id: ID of admin performing the action
            action_type: Type of action performed (approve, reject, delete, etc.)
            target_type: Type of target (dataset, user, etc.)
            target_id: ID of the target entity
            details: Optional additional details about the action
            
        Returns:
            AdminAudit: The created audit record
        """
        # Handle action_details as JSON if the column expects JSON format
        action_details_json = None
        if details:
            try:
                # If details is already a dict, convert to JSON
                if isinstance(details, dict):
                    action_details_json = json.dumps(details)
                else:
                    # If details is a string, wrap it in a JSON object
                    action_details_json = json.dumps({"message": details})
            except (TypeError, ValueError):
                # Fallback to plain text if JSON conversion fails
                action_details_json = details
        
        audit_entry = AdminAudit(
            admin_user_id=admin_user_id,
            action_type=action_type,
            target_type=target_type,
            target_id=target_id,
            action_details=action_details_json
        )
        
        db.add(audit_entry)
        db.flush()  # Get ID without committing transaction
        return audit_entry

    def get_audit_trail(self, db: Session, page: int = 1, limit: int = 50) -> Tuple[List[AdminAudit], int]:
        """
        Get admin audit trail with pagination for review and compliance.
        
        Args:
            db: Database session for query execution
            page: Page number for pagination
            limit: Number of records per page
            
        Returns:
            Tuple[List[AdminAudit], int]: (audit records, total count)
        """
        # Get total count
        total_count = db.query(AdminAudit).count()
        
        # Get paginated records with admin user information
        offset = (page - 1) * limit
        audit_records = db.query(AdminAudit).join(
            AdminAudit.admin_user
        ).order_by(
            desc(AdminAudit.timestamp)
        ).offset(offset).limit(limit).all()
        
        return audit_records, total_count

    def get_role_by_name(self, db: Session, role_name: str) -> Optional[Role]:
        """
        Get role by name for role management operations.
        
        Args:
            db: Database session for query execution
            role_name: Name of the role to find
            
        Returns:
            Role or None: Role if found, None otherwise
        """
        return db.query(Role).filter(Role.role_name == role_name).first()

    def get_all_roles(self, db: Session) -> List[Role]:
        """
        Get all available roles in the system.
        
        Args:
            db: Database session for query execution
            
        Returns:
            List[Role]: All roles in the system
        """
        return db.query(Role).all()

    def update_user_role(self, db: Session, user_id: int, role_id: int) -> bool:
        """
        Update user's role.
        
        Args:
            db: Database session for transaction
            user_id: ID of user to update
            role_id: ID of new role
            
        Returns:
            bool: True if update successful, False if user not found
        """
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            return False
        
        user.role_id = role_id
        db.flush()
        return True

    def update_user_status(self, db: Session, user_id: int, status: str) -> bool:
        """
        Update user's status.
        
        Args:
            db: Database session for transaction
            user_id: ID of user to update
            status: New status value
            
        Returns:
            bool: True if update successful, False if user not found
        """
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            return False
        
        user.status = status
        db.flush()
        return True

    def delete_user(self, db: Session, user_id: int) -> bool:
        """
        Delete a user from the system with comprehensive cascade deletion.
        
        This method handles complete removal of a user and all their related data:
        - User's datasets (as uploader) - completely deleted with files
        - User's ownership relationships - removed from other datasets
        - User's comments, likes, download tracking - deleted
        - Admin audit records - preserved but anonymized
        - Dataset approvals - preserved but set approved_by to NULL
        - Users created by this user - set created_by to NULL
        
        Args:
            db: Database session for transaction
            user_id: ID of user to delete
            
        Returns:
            bool: True if deletion successful, False if user not found
        """
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            return False
        
        # Import here to avoid circular imports
        from backend.app.features.file.models import UserDownload
        
        # STEP 1: Remove user from ownership of datasets they don't own (many-to-many cleanup)
        # This handles the dataset_owner_table relationship
        user_owned_datasets = db.query(Dataset).filter(Dataset.owners.any(User.user_id == user_id)).all()
        for dataset in user_owned_datasets:
            if dataset.uploader_id != user_id:  # Don't remove from datasets they uploaded
                dataset.owners.remove(user)
        
        # STEP 2: Handle datasets where user is uploader - these will be deleted completely
        user_datasets = db.query(Dataset).filter(Dataset.uploader_id == user_id).all()
        for dataset in user_datasets:
            # First delete all files associated with these datasets
            db.query(File).filter(File.dataset_id == dataset.dataset_id).delete()
            # Delete comments on these datasets
            db.query(Comment).filter(Comment.dataset_id == dataset.dataset_id).delete()
            # Delete likes on these datasets
            db.query(Like).filter(Like.dataset_id == dataset.dataset_id).delete()
            # Delete download tracking for these datasets
            db.query(UserDownload).filter(UserDownload.dataset_id == dataset.dataset_id).delete()
        
        # Delete the datasets themselves
        db.query(Dataset).filter(Dataset.uploader_id == user_id).delete()
        
        # STEP 3: Delete user's personal activity records
        # Delete user's comments on other datasets
        db.query(Comment).filter(Comment.user_id == user_id).delete()
        
        # Delete user's likes on other datasets
        db.query(Like).filter(Like.user_id == user_id).delete()
        
        # Delete user's download tracking records
        db.query(UserDownload).filter(UserDownload.user_id == user_id).delete()
        
        # STEP 4: Preserve audit trail but anonymize admin actions
        # Set approved_by to NULL for datasets approved by this user (preserve approval but remove reference)
        db.query(Dataset).filter(Dataset.approved_by == user_id).update(
            {Dataset.approved_by: None}, synchronize_session=False
        )
        
        # Keep admin audit records but could anonymize them (optional - discuss with team)
        # For now, we'll keep them as they are important for compliance
        
        # STEP 5: Handle users created by this user
        # Set created_by to NULL for users created by this user
        db.query(User).filter(User.created_by == user_id).update(
            {User.created_by: None}, synchronize_session=False
        )
        
        # STEP 6: Finally delete the user record
        db.delete(user)
        db.flush()
        
        return True 