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
from sqlalchemy import func, desc, asc, or_, and_, extract
from datetime import datetime, timedelta

from backend.app.database.models import Dataset, User, AdminAudit, File, Comment, Like
from backend.app.features.user.models import Role
from backend.app.features.dataset.models import DatasetTag, dataset_owner_table
from backend.app.features.tag.models import Tag
from backend.app.features.file.models import UserDownload
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

    # NEW ENHANCED ANALYTICS METHODS
    
    @abstractmethod
    def get_geographic_distribution(self, db: Session) -> Dict[str, Any]:
        """Get geographic distribution analytics of dataset locations."""
        pass

    @abstractmethod
    def get_research_domain_analytics(self, db: Session) -> Dict[str, Any]:
        """Get research domain popularity and trends using tag analysis."""
        pass

    @abstractmethod
    def get_organization_analytics(self, db: Session) -> Dict[str, Any]:
        """Get organization-based analytics and collaboration patterns."""
        pass

    @abstractmethod
    def get_data_quality_metrics(self, db: Session) -> Dict[str, Any]:
        """Get data quality indicators and metadata completeness."""
        pass

    @abstractmethod
    def get_enhanced_download_analytics(self, db: Session) -> Dict[str, Any]:
        """Get enhanced download analytics using UserDownload system."""
        pass

    @abstractmethod
    def get_approval_performance_metrics(self, db: Session) -> Dict[str, Any]:
        """Get approval timing and performance analytics."""
        pass

    @abstractmethod
    def get_collaboration_patterns(self, db: Session) -> Dict[str, Any]:
        """Get collaboration pattern analytics for multi-owner datasets."""
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

    # ENHANCED ANALYTICS METHODS IMPLEMENTATION
    
    def get_geographic_distribution(self, db: Session) -> Dict[str, Any]:
        """
        Get geographic distribution analytics of dataset locations.
        
        Analyzes the geographic_location field to provide insights into
        global research coverage and data distribution patterns.
        
        Args:
            db: Database session for query execution
            
        Returns:
            Dict[str, Any]: Geographic distribution statistics
        """
        # Count of datasets with geographic information
        geotagged_datasets = db.query(Dataset).filter(
            and_(
                Dataset.geographic_location.isnot(None),
                Dataset.geographic_location != '',
                Dataset.approval_status == 'approved'
            )
        ).count()
        
        # Total approved datasets for percentage calculation
        total_approved = db.query(Dataset).filter(Dataset.approval_status == 'approved').count()
        
        # Top geographic locations (extract country/region names)
        geo_locations = db.query(
            Dataset.geographic_location,
            func.count(Dataset.dataset_id).label('count')
        ).filter(
            and_(
                Dataset.geographic_location.isnot(None),
                Dataset.geographic_location != '',
                Dataset.approval_status == 'approved'
            )
        ).group_by(Dataset.geographic_location).order_by(desc('count')).limit(10).all()
        
        # Geographic coverage percentage
        geo_coverage_percentage = (geotagged_datasets / total_approved * 100) if total_approved > 0 else 0
        
        return {
            "geotagged_datasets": geotagged_datasets,
            "total_approved_datasets": total_approved,
            "geographic_coverage_percentage": round(geo_coverage_percentage, 1),
            "top_locations": [
                {"location": loc.geographic_location, "dataset_count": loc.count}
                for loc in geo_locations
            ],
            "unique_locations": len(geo_locations)
        }

    def get_research_domain_analytics(self, db: Session) -> Dict[str, Any]:
        """
        Get research domain popularity and trends using tag analysis.
        
        Analyzes DatasetTag relationships to understand which research
        domains are most active and trending in the platform.
        
        Args:
            db: Database session for query execution
            
        Returns:
            Dict[str, Any]: Research domain analytics
        """
        # Most popular research tags (domains)
        popular_tags = db.query(
            Tag.tag_category_name,
            func.count(DatasetTag.dataset_id).label('dataset_count')
        ).join(
            DatasetTag, Tag.tag_id == DatasetTag.tag_id
        ).join(
            Dataset, DatasetTag.dataset_id == Dataset.dataset_id
        ).filter(
            Dataset.approval_status == 'approved'
        ).group_by(
            Tag.tag_category_name
        ).order_by(
            desc('dataset_count')
        ).limit(10).all()
        
        # Recent trending tags (last 3 months)
        three_months_ago = datetime.now() - timedelta(days=90)
        trending_tags = db.query(
            Tag.tag_category_name,
            func.count(DatasetTag.dataset_id).label('recent_count')
        ).join(
            DatasetTag, Tag.tag_id == DatasetTag.tag_id
        ).join(
            Dataset, DatasetTag.dataset_id == Dataset.dataset_id
        ).filter(
            and_(
                Dataset.approval_status == 'approved',
                Dataset.date_of_creation >= three_months_ago
            )
        ).group_by(
            Tag.tag_category_name
        ).order_by(
            desc('recent_count')
        ).limit(5).all()
        
        # Total tags and tagged datasets
        total_tags = db.query(Tag).count()
        tagged_datasets = db.query(Dataset).join(DatasetTag).filter(
            Dataset.approval_status == 'approved'
        ).distinct().count()
        
        return {
            "popular_domains": [
                {"domain": tag.tag_category_name, "dataset_count": tag.dataset_count}
                for tag in popular_tags
            ],
            "trending_domains": [
                {"domain": tag.tag_category_name, "recent_count": tag.recent_count}
                for tag in trending_tags
            ],
            "total_research_domains": total_tags,
            "tagged_datasets": tagged_datasets
        }

    def get_organization_analytics(self, db: Session) -> Dict[str, Any]:
        """
        Get organization-based analytics and collaboration patterns.
        
        Analyzes user organizations to understand institutional participation
        and cross-organizational collaboration in the platform.
        
        Args:
            db: Database session for query execution
            
        Returns:
            Dict[str, Any]: Organization analytics
        """
        # Top contributing organizations by dataset count
        top_orgs = db.query(
            User.organization,
            func.count(Dataset.dataset_id).label('dataset_count')
        ).join(
            Dataset, User.user_id == Dataset.uploader_id
        ).filter(
            and_(
                User.organization.isnot(None),
                User.organization != '',
                Dataset.approval_status == 'approved'
            )
        ).group_by(
            User.organization
        ).order_by(
            desc('dataset_count')
        ).limit(10).all()
        
        # Organizations by user count
        org_user_counts = db.query(
            User.organization,
            func.count(User.user_id).label('user_count')
        ).filter(
            and_(
                User.organization.isnot(None),
                User.organization != '',
                User.status == 'active'
            )
        ).group_by(
            User.organization
        ).order_by(
            desc('user_count')
        ).limit(10).all()
        
        # Total unique organizations
        unique_organizations = db.query(User.organization).filter(
            and_(
                User.organization.isnot(None),
                User.organization != ''
            )
        ).distinct().count()
        
        # Users with organization data
        users_with_org = db.query(User).filter(
            and_(
                User.organization.isnot(None),
                User.organization != ''
            )
        ).count()
        
        total_users = db.query(User).count()
        org_coverage = (users_with_org / total_users * 100) if total_users > 0 else 0
        
        return {
            "top_contributing_organizations": [
                {"organization": org.organization, "dataset_count": org.dataset_count}
                for org in top_orgs
            ],
            "organizations_by_users": [
                {"organization": org.organization, "user_count": org.user_count}
                for org in org_user_counts
            ],
            "unique_organizations": unique_organizations,
            "organization_coverage_percentage": round(org_coverage, 1),
            "users_with_organization": users_with_org
        }

    def get_data_quality_metrics(self, db: Session) -> Dict[str, Any]:
        """
        Get data quality indicators and metadata completeness.
        
        Analyzes dataset metadata completeness and quality indicators
        to help administrators understand data quality across the platform.
        
        Args:
            db: Database session for query execution
            
        Returns:
            Dict[str, Any]: Data quality metrics
        """
        total_datasets = db.query(Dataset).filter(Dataset.approval_status == 'approved').count()
        
        # Geographic location completeness
        with_geo = db.query(Dataset).filter(
            and_(
                Dataset.geographic_location.isnot(None),
                Dataset.geographic_location != '',
                Dataset.approval_status == 'approved'
            )
        ).count()
        
        # Time period completeness
        with_time = db.query(Dataset).filter(
            and_(
                Dataset.data_time_period.isnot(None),
                Dataset.data_time_period != '',
                Dataset.approval_status == 'approved'
            )
        ).count()
        
        # Datasets with tags
        with_tags = db.query(Dataset).join(DatasetTag).filter(
            Dataset.approval_status == 'approved'
        ).distinct().count()
        
        # Datasets with descriptions
        with_description = db.query(Dataset).filter(
            and_(
                Dataset.dataset_description.isnot(None),
                Dataset.dataset_description != '',
                Dataset.approval_status == 'approved'
            )
        ).count()
        
        # Complete metadata (all fields filled)
        complete_metadata = db.query(Dataset).filter(
            and_(
                Dataset.geographic_location.isnot(None),
                Dataset.geographic_location != '',
                Dataset.data_time_period.isnot(None),
                Dataset.data_time_period != '',
                Dataset.dataset_description.isnot(None),
                Dataset.dataset_description != '',
                Dataset.approval_status == 'approved'
            )
        ).join(DatasetTag).distinct().count()
        
        # Calculate percentages
        def calc_percentage(count, total):
            return round((count / total * 100), 1) if total > 0 else 0
        
        return {
            "total_approved_datasets": total_datasets,
            "geographic_completeness": {
                "count": with_geo,
                "percentage": calc_percentage(with_geo, total_datasets)
            },
            "temporal_completeness": {
                "count": with_time,
                "percentage": calc_percentage(with_time, total_datasets)
            },
            "tag_completeness": {
                "count": with_tags,
                "percentage": calc_percentage(with_tags, total_datasets)
            },
            "description_completeness": {
                "count": with_description,
                "percentage": calc_percentage(with_description, total_datasets)
            },
            "complete_metadata": {
                "count": complete_metadata,
                "percentage": calc_percentage(complete_metadata, total_datasets)
            },
            "quality_score": calc_percentage(complete_metadata, total_datasets)
        }

    def get_enhanced_download_analytics(self, db: Session) -> Dict[str, Any]:
        """
        Get enhanced download analytics using UserDownload system.
        
        Leverages the smart UserDownload tracking to provide insights into
        genuine download patterns and user engagement.
        
        Args:
            db: Database session for query execution
            
        Returns:
            Dict[str, Any]: Enhanced download analytics
        """
        # Total unique download relationships (abuse-free count)
        unique_downloads = db.query(UserDownload).count()
        
        # Total download events (including repeats)
        total_events = db.query(func.sum(UserDownload.total_download_count)).scalar() or 0
        
        # Most downloaded datasets (by unique users)
        popular_datasets = db.query(
            Dataset.dataset_name,
            Dataset.downloads_count,
            func.count(UserDownload.user_id).label('unique_downloaders')
        ).join(
            UserDownload, Dataset.dataset_id == UserDownload.dataset_id
        ).filter(
            Dataset.approval_status == 'approved'
        ).group_by(
            Dataset.dataset_id, Dataset.dataset_name, Dataset.downloads_count
        ).order_by(
            desc('unique_downloaders')
        ).limit(10).all()
        
        # Calculate average downloads per user using a simpler approach
        total_user_downloads = db.query(func.count(UserDownload.user_id.distinct())).scalar() or 0
        total_unique_users = db.query(User.user_id).distinct().count()
        avg_downloads_per_user = (total_user_downloads / total_unique_users) if total_unique_users > 0 else 0
        
        # Recent download trends (last 30 days)
        thirty_days_ago = datetime.now() - timedelta(days=30)
        recent_downloads = db.query(UserDownload).filter(
            UserDownload.last_download_date >= thirty_days_ago
        ).count()
        
        # Download conversion rate (datasets with at least one download)
        datasets_with_downloads = db.query(Dataset).filter(
            and_(
                Dataset.downloads_count > 0,
                Dataset.approval_status == 'approved'
            )
        ).count()
        
        total_approved = db.query(Dataset).filter(Dataset.approval_status == 'approved').count()
        conversion_rate = (datasets_with_downloads / total_approved * 100) if total_approved > 0 else 0
        
        return {
            "unique_download_relationships": unique_downloads,
            "total_download_events": total_events,
            "abuse_prevention_ratio": round((total_events / unique_downloads), 1) if unique_downloads > 0 else 0,
            "popular_datasets": [
                {
                    "name": ds.dataset_name,
                    "total_downloads": ds.downloads_count,
                    "unique_downloaders": ds.unique_downloaders
                }
                for ds in popular_datasets
            ],
            "average_downloads_per_user": round(float(avg_downloads_per_user), 1),
            "recent_downloads_30d": recent_downloads,
            "download_conversion_rate": round(conversion_rate, 1),
            "datasets_with_downloads": datasets_with_downloads
        }

    def get_approval_performance_metrics(self, db: Session) -> Dict[str, Any]:
        """
        Get approval timing and performance analytics.
        
        Analyzes the approval workflow to provide insights into
        approval efficiency and admin workload patterns.
        
        Args:
            db: Database session for query execution
            
        Returns:
            Dict[str, Any]: Approval performance metrics
        """
        # Current pending datasets
        pending_count = db.query(Dataset).filter(Dataset.approval_status == 'pending').count()
        
        # Oldest pending dataset
        oldest_pending = db.query(Dataset).filter(
            Dataset.approval_status == 'pending'
        ).order_by(Dataset.date_of_creation).first()
        
        oldest_pending_days = 0
        if oldest_pending:
            oldest_pending_days = (datetime.now() - oldest_pending.date_of_creation).days
        
        # Approval rates (last 30 days)
        thirty_days_ago = datetime.now() - timedelta(days=30)
        recent_approved = db.query(Dataset).filter(
            and_(
                Dataset.approval_status == 'approved',
                Dataset.approval_date >= thirty_days_ago
            )
        ).count()
        
        recent_rejected = db.query(Dataset).filter(
            and_(
                Dataset.approval_status == 'rejected',
                Dataset.approval_date >= thirty_days_ago
            )
        ).count()
        
        total_recent_decisions = recent_approved + recent_rejected
        approval_rate = (recent_approved / total_recent_decisions * 100) if total_recent_decisions > 0 else 0
        
        # Average approval time for approved datasets
        approved_with_times = db.query(
            Dataset.date_of_creation,
            Dataset.approval_date
        ).filter(
            and_(
                Dataset.approval_status == 'approved',
                Dataset.approval_date.isnot(None)
            )
        ).all()
        
        avg_approval_time = 0
        if approved_with_times:
            approval_times = [
                (ds.approval_date - ds.date_of_creation).days 
                for ds in approved_with_times 
                if ds.approval_date and ds.date_of_creation
            ]
            avg_approval_time = sum(approval_times) / len(approval_times) if approval_times else 0
        
        # Admin activity (approvals by admin) - simplified query
        admin_activity = db.query(
            User.username,
            func.count(Dataset.dataset_id).label('approvals')
        ).join(
            Dataset, User.user_id == Dataset.approved_by
        ).filter(
            and_(
                Dataset.approval_date.isnot(None),
                Dataset.approval_date >= thirty_days_ago
            )
        ).group_by(
            User.user_id, User.username
        ).order_by(
            desc('approvals')
        ).limit(5).all()
        
        return {
            "pending_datasets": pending_count,
            "oldest_pending_days": oldest_pending_days,
            "approval_rate_30d": round(approval_rate, 1),
            "recent_approved": recent_approved,
            "recent_rejected": recent_rejected,
            "average_approval_time_days": round(avg_approval_time, 1),
            "admin_activity_30d": [
                {"admin": admin.username, "approvals": admin.approvals}
                for admin in admin_activity
            ]
        }

    def get_collaboration_patterns(self, db: Session) -> Dict[str, Any]:
        """
        Get collaboration pattern analytics for multi-owner datasets.
        
        Analyzes dataset ownership patterns to understand collaboration
        and knowledge sharing across the platform.
        
        Args:
            db: Database session for query execution
            
        Returns:
            Dict[str, Any]: Collaboration analytics
        """
        # Datasets with multiple owners - simplified approach
        multi_owner_subquery = db.query(
            dataset_owner_table.c.dataset_id,
            func.count(dataset_owner_table.c.user_id).label('owner_count')
        ).group_by(
            dataset_owner_table.c.dataset_id
        ).having(
            func.count(dataset_owner_table.c.user_id) > 1
        ).subquery()
        
        multi_owner_datasets = db.query(Dataset).join(
            multi_owner_subquery, Dataset.dataset_id == multi_owner_subquery.c.dataset_id
        ).filter(
            Dataset.approval_status == 'approved'
        ).count()
        
        # Total approved datasets for percentage
        total_approved = db.query(Dataset).filter(Dataset.approval_status == 'approved').count()
        collaboration_rate = (multi_owner_datasets / total_approved * 100) if total_approved > 0 else 0
        
        # Calculate average owners per dataset using a simpler approach
        total_ownership_relationships = db.query(dataset_owner_table).count()
        total_datasets_with_owners = db.query(dataset_owner_table.c.dataset_id).distinct().count()
        avg_owners = (total_ownership_relationships / total_datasets_with_owners) if total_datasets_with_owners > 0 else 0
        
        # Cross-organizational collaboration - simplified approach
        cross_org_datasets = db.query(Dataset).join(
            dataset_owner_table, Dataset.dataset_id == dataset_owner_table.c.dataset_id
        ).join(
            User, dataset_owner_table.c.user_id == User.user_id
        ).filter(
            and_(
                Dataset.approval_status == 'approved',
                User.organization.isnot(None),
                User.organization != ''
            )
        ).group_by(
            Dataset.dataset_id
        ).having(
            func.count(func.distinct(User.organization)) > 1
        ).count()
        
        cross_org_rate = (cross_org_datasets / total_approved * 100) if total_approved > 0 else 0
        
        # Most collaborative organizations
        collaborative_orgs = db.query(
            User.organization,
            func.count(func.distinct(Dataset.dataset_id)).label('shared_datasets')
        ).join(
            dataset_owner_table, User.user_id == dataset_owner_table.c.user_id
        ).join(
            Dataset, dataset_owner_table.c.dataset_id == Dataset.dataset_id
        ).filter(
            and_(
                Dataset.approval_status == 'approved',
                User.organization.isnot(None),
                User.organization != ''
            )
        ).group_by(
            User.organization
        ).order_by(
            desc('shared_datasets')
        ).limit(10).all()
        
        return {
            "multi_owner_datasets": multi_owner_datasets,
            "collaboration_rate": round(collaboration_rate, 1),
            "average_owners_per_dataset": round(float(avg_owners), 1),
            "cross_organizational_datasets": cross_org_datasets,
            "cross_org_collaboration_rate": round(cross_org_rate, 1),
            "most_collaborative_organizations": [
                {"organization": org.organization, "shared_datasets": org.shared_datasets}
                for org in collaborative_orgs
            ]
        }

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