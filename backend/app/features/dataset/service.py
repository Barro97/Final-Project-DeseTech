"""
Dataset Service Layer - Business Logic and Transaction Management

This module implements the Service Layer pattern for dataset operations, providing:
- Business logic encapsulation and validation
- Transaction management and data consistency
- Permission checking and authorization
- Cross-cutting concerns like logging and error handling

ARCHITECTURE OVERVIEW:
├── API Layer (api.py)           # HTTP endpoints and request/response handling
├── Service Layer (service.py)   # ← THIS FILE: Business logic and transactions
├── Repository Layer (repository.py) # Data access and persistence
└── Database Models              # SQLAlchemy ORM models

The service layer serves as the primary interface for all dataset operations,
ensuring business rules are enforced consistently across different entry points.

KEY DESIGN DECISIONS:
1. **Transaction Management**: Each public method manages its own database transaction
2. **Permission Checking**: All operations validate user permissions before execution
3. **Error Handling**: Business exceptions are caught and properly categorized
4. **Data Transformation**: Converts between API schemas and internal models
5. **Dependency Injection**: Repository can be injected for testing and flexibility

USAGE EXAMPLE:
    # Initialize service (with default repository)
    service = DatasetService()
    
    # Create a dataset with automatic transaction management
    response = service.create_dataset(db_session, create_request)
    
    # Service handles: validation, permissions, tags, owners, transactions
"""
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from datetime import datetime
import logging

from backend.app.database.models import Dataset, User
from backend.app.features.dataset.repository import DatasetRepository, DatasetRepositoryInterface
from backend.app.features.dataset.schemas.request import (
    DatasetCreateRequest, DatasetUpdateRequest, OwnerActionRequest, 
    BatchDeleteRequest, DatasetFilterRequest
)
from backend.app.features.dataset.schemas.response import (
    DatasetResponse, DatasetDetailResponse, DatasetListResponse,
    BatchDeleteResponse, OwnerActionResponse, DatasetStatsResponse, PublicStatsResponse
)
from backend.app.features.dataset.schemas.internal import (
    DatasetCreateInternal, DatasetUpdateInternal, DatasetFilterInternal,
    BatchDeleteResult
)
from backend.app.features.dataset.exceptions import (
    DatasetNotFoundError, DatasetPermissionError, DatasetOwnershipError,
    DatasetValidationError, DatasetError
)
from backend.app.features.dataset.utils import handle_dataset_tags, create_safe_filename
from backend.app.features.file.utils.upload import delete_file_from_storage
from backend.app.features.file.crud import delete_file_record

logger = logging.getLogger(__name__)


class DatasetService:
    """
    Service layer for dataset business logic and transaction management.
    
    This class encapsulates all business logic related to dataset operations,
    ensuring consistent behavior across different API endpoints and providing
    a clean interface for dataset management.
    
    RESPONSIBILITIES:
    - Validate business rules and constraints
    - Manage database transactions and rollbacks
    - Check user permissions and authorization
    - Handle cross-cutting concerns (logging, error handling)
    - Transform data between API schemas and database models
    - Coordinate with external services (file storage, etc.)
    
    TRANSACTION STRATEGY:
    Each public method manages its own database transaction. Operations either
    complete successfully (commit) or fail completely (rollback). This ensures
    data consistency and makes error handling predictable.
    
    PERMISSION MODEL:
    - Dataset Creator: Can modify/delete their datasets
    - Dataset Owners: Can modify datasets they own (but not delete unless admin)
    - Admins: Can perform any operation on any dataset
    - Regular Users: Can only view public datasets
    
    Args:
        repository: Data access layer (injectable for testing)
        
    Example:
        >>> service = DatasetService()
        >>> response = service.create_dataset(db, create_request)
        >>> print(f"Created dataset: {response.dataset_name}")
    """

    def __init__(self, repository: DatasetRepositoryInterface = None):
        """
        Initialize the dataset service with dependency injection support.
        
        Args:
            repository: Optional repository implementation. If None, uses default
                       SQLAlchemy repository. Useful for testing with mock repositories.
        """
        self.repository = repository or DatasetRepository()

    def create_dataset(self, db: Session, request: DatasetCreateRequest) -> DatasetResponse:
        """
        Create a new dataset with full business logic validation.
        
        This method handles the complete dataset creation workflow:
        1. Validates the uploader exists in the system
        2. Creates the dataset record with proper defaults
        3. Processes and creates associated tags
        4. Sets the uploader as the initial dataset owner
        5. Commits the transaction or rolls back on any error
        
        BUSINESS RULES:
        - Uploader must be a valid user in the system
        - Dataset name must be unique for the uploader
        - Tags are automatically created if they don't exist
        - Creator is automatically added as the first owner
        - Downloads count starts at 0
        
        Args:
            db: Active database session for transaction management
            request: Validated dataset creation request with name, description, tags, etc.
            
        Returns:
            DatasetResponse: Complete dataset information including generated ID and metadata
            
        Raises:
            DatasetValidationError: If uploader doesn't exist or data is invalid
            DatasetError: If creation fails due to database constraints
            
        Example:
            >>> request = DatasetCreateRequest(
            ...     dataset_name="Research Data 2024",
            ...     dataset_description="Annual research findings",
            ...     uploader_id=123,
            ...     tags=["research", "2024"]
            ... )
            >>> response = service.create_dataset(db, request)
            >>> print(f"Created dataset {response.dataset_id}")
        """
        try:
            # STEP 1: Validate that the uploader exists in our user system
            uploader = db.query(User).filter_by(user_id=request.uploader_id).first()
            if not uploader:
                raise DatasetValidationError("Uploader not found")

            # STEP 2: Create the core dataset record with business defaults
            dataset = Dataset(
                dataset_name=request.dataset_name,
                dataset_description=request.dataset_description,
                uploader_id=request.uploader_id,
                downloads_count=0,  # Always start with 0 downloads
                approval_status='pending',  # New datasets require approval
                geographic_location=request.geographic_location,
                data_time_period=request.data_time_period
            )

            # STEP 3: Process tags - create new ones if they don't exist
            if request.tags:
                # This utility handles tag creation/retrieval and validation
                tag_objects = handle_dataset_tags(db, request.tags)
                dataset.tags = tag_objects

            # STEP 4: Persist the dataset to the database
            created_dataset = self.repository.create(db, dataset)

            # STEP 5: Set up ownership - creator is always the first owner
            created_dataset.owners = [uploader]

            # STEP 6: Commit all changes atomically
            db.commit()
            db.refresh(created_dataset)  # Get the latest state with all relationships

            return self._format_dataset_response(created_dataset, db)

        except Exception as e:
            # TRANSACTION SAFETY: Rollback on any error to maintain consistency
            db.rollback()
            logger.error(f"Error creating dataset: {str(e)}")
            raise

    def get_dataset(self, db: Session, dataset_id: int) -> DatasetResponse:
        """
        Retrieve a dataset by ID with basic information.
        
        This is a read-only operation that doesn't require special permissions.
        Returns the core dataset information without detailed relationships.
        
        Args:
            db: Database session for query execution
            dataset_id: Unique identifier of the dataset to retrieve
            
        Returns:
            DatasetResponse: Basic dataset information including name, description,
                           creation date, owner IDs, and tag names
                           
        Raises:
            DatasetNotFoundError: If no dataset exists with the given ID
            
        Example:
            >>> response = service.get_dataset(db, 123)
            >>> print(f"Dataset: {response.dataset_name}")
        """
        dataset = self.repository.get_by_id(db, dataset_id)
        if not dataset:
            raise DatasetNotFoundError(dataset_id)

        return self._format_dataset_response(dataset, db)

    def get_dataset_detail(self, db: Session, dataset_id: int) -> DatasetDetailResponse:
        """
        Retrieve detailed dataset information including relationships.
        
        This provides extended information beyond the basic dataset details,
        including owner information, tag details, file statistics, and more.
        Useful for dataset detail pages that need comprehensive information.
        
        Args:
            db: Database session for query execution
            dataset_id: Unique identifier of the dataset
            
        Returns:
            DatasetDetailResponse: Extended dataset information including:
                - All basic dataset fields
                - Detailed owner information (names, etc.)
                - Complete tag information
                - File count and total size statistics
                
        Raises:
            DatasetNotFoundError: If dataset doesn't exist
            
        Example:
            >>> detail = service.get_dataset_detail(db, 123)
            >>> print(f"Files: {detail.file_count}, Size: {detail.total_size}")
        """
        dataset = self.repository.get_by_id(db, dataset_id)
        if not dataset:
            raise DatasetNotFoundError(dataset_id)

        # Get file statistics for this dataset
        files = self.repository.get_files(db, dataset_id)
        
        return DatasetDetailResponse(
            **self._format_dataset_response(dataset, db).dict(),
            # Extended information not available in basic response
            owner_details=[
                {"user_id": owner.user_id, "username": owner.username,
                 "first_name": owner.first_name, "last_name": owner.last_name}
                for owner in dataset.owners
            ],
            tag_details=[
                {"tag_id": tag.tag_id, "tag_category_name": tag.tag_category_name}
                for tag in dataset.tags
            ],
            file_count=len(files),
            total_size=sum(file.size or 0 for file in files)  # Handle null sizes
        )

    def update_dataset(self, db: Session, dataset_id: int, request: DatasetUpdateRequest, 
                      current_user_id: int) -> DatasetResponse:
        """
        Update a dataset with permission checking and business validation.
        
        This method provides a complete update workflow with proper authorization:
        1. Validates the dataset exists
        2. Checks user permissions (owner or creator)
        3. Applies updates with business rule validation
        4. Handles tag updates with creation of new tags
        5. Updates the last modified timestamp
        6. Manages the transaction atomically
        
        PERMISSION RULES:
        - Dataset creator can always update
        - Dataset owners can update
        - Admins can update any dataset
        - Other users are denied access
        
        Args:
            db: Database session for transaction management
            dataset_id: ID of dataset to update
            request: Update request with optional fields (name, description, tags)
            current_user_id: ID of user requesting the update (for permission check)
            
        Returns:
            DatasetResponse: Updated dataset information
            
        Raises:
            DatasetNotFoundError: If dataset doesn't exist
            DatasetPermissionError: If user lacks update permissions
            DatasetValidationError: If update data is invalid
            
        Example:
            >>> request = DatasetUpdateRequest(
            ...     dataset_name="Updated Name",
            ...     tags=["new-tag", "updated"]
            ... )
            >>> response = service.update_dataset(db, 123, request, user_id=456)
        """
        dataset = self.repository.get_by_id(db, dataset_id)
        if not dataset:
            raise DatasetNotFoundError(dataset_id)

        # PERMISSION CHECK: Ensure user can modify this dataset
        if not self._user_can_modify_dataset(dataset, current_user_id):
            raise DatasetPermissionError("User is not authorized to modify this dataset")

        try:
            # STEP 1: Prepare the update data
            updates = {}
            
            # Only update fields that were provided (partial updates)
            if request.dataset_name is not None:
                updates['dataset_name'] = request.dataset_name
            
            if request.dataset_description is not None:
                updates['dataset_description'] = request.dataset_description
            
            # Agricultural research context fields (optional)
            if request.geographic_location is not None:
                updates['geographic_location'] = request.geographic_location
            
            if request.data_time_period is not None:
                updates['data_time_period'] = request.data_time_period
            
            # Always update the last modified timestamp on any change
            updates['dataset_last_updated'] = datetime.now()

            # STEP 2: Handle tag updates separately (more complex logic)
            if request.tags is not None:
                # Replace all existing tags with the new set
                tag_objects = handle_dataset_tags(db, request.tags)
                dataset.tags = tag_objects

            # STEP 3: Apply the field updates
            updated_dataset = self.repository.update(db, dataset_id, updates)
            
            # STEP 4: Commit all changes atomically
            db.commit()
            db.refresh(updated_dataset)

            return self._format_dataset_response(updated_dataset, db)

        except Exception as e:
            # TRANSACTION SAFETY: Rollback on any error
            db.rollback()
            logger.error(f"Error updating dataset {dataset_id}: {str(e)}")
            raise

    def delete_dataset(self, db: Session, dataset_id: int, current_user_id: int) -> bool:
        """
        Delete a dataset with complete cleanup and permission validation.
        
        This method performs a cascading delete operation:
        1. Validates permissions (stricter than update permissions)
        2. Deletes all associated files from storage and database
        3. Removes the dataset record (cascades to relationships)
        4. Handles cleanup failures gracefully with logging
        
        PERMISSION RULES:
        - Dataset creator can always delete
        - Admins can delete any dataset
        - Regular owners cannot delete (only modify)
        
        CLEANUP PROCESS:
        - Deletes files from external storage (e.g., Supabase)
        - Removes file records from database
        - Removes dataset-owner relationships
        - Removes dataset-tag relationships
        - Deletes the dataset record itself
        
        Args:
            db: Database session for transaction management
            dataset_id: ID of dataset to delete
            current_user_id: ID of user requesting deletion
            
        Returns:
            bool: True if deletion successful, False if failed
            
        Raises:
            DatasetNotFoundError: If dataset doesn't exist
            DatasetPermissionError: If user lacks deletion permissions
            
        Example:
            >>> success = service.delete_dataset(db, 123, user_id=456)
            >>> if success:
            ...     print("Dataset deleted successfully")
        """
        dataset = self.repository.get_by_id(db, dataset_id)
        if not dataset:
            raise DatasetNotFoundError(dataset_id)

        # PERMISSION CHECK: Deletion requires stricter permissions than updates
        if not self._user_can_modify_dataset(dataset, current_user_id):
            raise DatasetPermissionError("User is not authorized to delete this dataset")

        try:
            # STEP 1: Clean up all associated files
            # This is done before deleting the dataset to maintain referential integrity
            for file_obj in dataset.files:
                try:
                    # Remove from database first
                    delete_file_record(db=db, file_id=file_obj.file_id)
                    # Then remove from external storage
                    delete_file_from_storage(file_obj.file_url)
                except Exception as e:
                    # Log cleanup failures but continue with other files
                    logger.error(f"Error deleting file {file_obj.file_id}: {str(e)}")
                    # Continue with other files - partial cleanup is better than none

            # STEP 2: Delete the dataset itself (cascades to relationships)
            success = self.repository.delete(db, dataset_id)
            
            if success:
                db.commit()
                return True
            else:
                db.rollback()
                return False

        except Exception as e:
            # TRANSACTION SAFETY: Rollback on any error
            db.rollback()
            logger.error(f"Error deleting dataset {dataset_id}: {str(e)}")
            raise

    def batch_delete_datasets(self, db: Session, request: BatchDeleteRequest, 
                             current_user_id: int) -> BatchDeleteResponse:
        """
        Delete multiple datasets efficiently with detailed error reporting.
        
        This method provides bulk deletion capabilities with comprehensive error handling:
        1. Validates user permissions (including admin privileges)
        2. Processes each dataset individually to isolate failures
        3. Provides detailed success/failure reporting
        4. Continues processing even if some deletions fail
        
        PERMISSION STRATEGY:
        - Admins can delete any dataset in the batch
        - Regular users can only delete datasets they own/created
        - Permission failures are reported per dataset, not batch-wide
        
        ERROR HANDLING:
        - Individual dataset failures don't stop the entire batch
        - Detailed error reporting for troubleshooting
        - Partial success is considered a valid outcome
        
        Args:
            db: Database session for transaction management
            request: Batch delete request containing list of dataset IDs
            current_user_id: ID of user requesting the batch deletion
            
        Returns:
            BatchDeleteResponse: Detailed results including:
                - Total number of successfully deleted datasets
                - List of errors for failed deletions
                - Success/failure breakdown by dataset ID
                
        Raises:
            DatasetPermissionError: If user is not found in the system
            
        Example:
            >>> request = BatchDeleteRequest(dataset_ids=[1, 2, 3, 4])
            >>> result = service.batch_delete_datasets(db, request, user_id=123)
            >>> print(f"Deleted {result.deleted_count} of {len(request.dataset_ids)}")
            >>> for error in result.errors:
            ...     print(f"Failed to delete {error['dataset_id']}: {error['error']}")
        """
        result = BatchDeleteResult(deleted_count=0, errors=[])

        # PERMISSION SETUP: Check if user is admin (can delete any dataset)
        current_user = db.query(User).filter(User.user_id == current_user_id).first()
        if not current_user:
            raise DatasetPermissionError("User not found")
        
        is_admin = current_user.role and current_user.role.role_name == "admin"

        # PROCESS EACH DATASET INDIVIDUALLY
        # This approach isolates failures and provides detailed feedback
        for dataset_id in request.dataset_ids:
            try:
                dataset = self.repository.get_by_id(db, dataset_id)
                if not dataset:
                    result.errors.append({
                        "dataset_id": dataset_id,
                        "error": "Dataset not found"
                    })
                    result.failed_ids.append(dataset_id)
                    continue

                # PERMISSION CHECK: Admin override or ownership validation
                if not (self._user_can_modify_dataset(dataset, current_user_id) or is_admin):
                    result.errors.append({
                        "dataset_id": dataset_id,
                        "error": "Permission denied"
                    })
                    result.failed_ids.append(dataset_id)
                    continue

                # ATTEMPT DELETION: Use single dataset deletion logic
                if self.delete_dataset(db, dataset_id, current_user_id):
                    result.deleted_count += 1
                    result.successful_ids.append(dataset_id)
                else:
                    result.errors.append({
                        "dataset_id": dataset_id,
                        "error": "Failed to delete dataset"
                    })
                    result.failed_ids.append(dataset_id)

            except Exception as e:
                # INDIVIDUAL ERROR HANDLING: Log and continue with next dataset
                result.errors.append({
                    "dataset_id": dataset_id,
                    "error": str(e)
                })
                result.failed_ids.append(dataset_id)

        # PREPARE USER-FRIENDLY RESPONSE MESSAGE
        message = f"Successfully deleted {result.deleted_count} datasets"
        if result.errors:
            message += f" with {len(result.errors)} errors"

        return BatchDeleteResponse(
            message=message,
            deleted_count=result.deleted_count,
            errors=result.errors
        )

    def get_user_datasets(self, db: Session, user_id: int, current_user_id: int) -> List[DatasetResponse]:
        """
        Retrieve all datasets associated with a specific user.
        
        This method returns datasets where the user is either:
        - The original uploader/creator
        - Listed as an owner (added later)
        
        PRIVACY AND PERMISSIONS:
        - Users can view their own datasets
        - Admins can view any user's datasets  
        - Other users are denied access (privacy protection)
        
        Args:
            db: Database session for query execution
            user_id: ID of user whose datasets to retrieve
            current_user_id: ID of user making the request (for permission check)
            
        Returns:
            List[DatasetResponse]: All datasets associated with the user
            
        Raises:
            DatasetPermissionError: If current user lacks permission to view target user's datasets
            
        Example:
            >>> datasets = service.get_user_datasets(db, user_id=123, current_user_id=123)
            >>> print(f"User has {len(datasets)} datasets")
        """
        # PERMISSION CHECK: Privacy protection for user dataset lists
        current_user = db.query(User).filter(User.user_id == current_user_id).first()
        is_admin = current_user and current_user.role and current_user.role.role_name == "admin"
        
        if current_user_id != user_id and not is_admin:
            raise DatasetPermissionError("Not authorized to view other users' datasets")

        # QUERY: Get datasets where user is uploader OR owner
        datasets = self.repository.get_by_user(db, user_id)
        return [self._format_dataset_response(dataset, db) for dataset in datasets]

    def get_public_user_datasets(self, db: Session, user_id: int) -> List[DatasetResponse]:
        """
        Retrieve only approved datasets associated with a specific user for public viewing.
        
        This method returns approved datasets where the user is either:
        - The original uploader/creator
        - Listed as an owner (added later)
        
        PUBLIC ACCESS:
        - No authentication required - open to all users
        - Only returns approved datasets (publicly visible content)
        - Protects user privacy by filtering out pending/rejected datasets
        
        Args:
            db: Database session for query execution
            user_id: ID of user whose public datasets to retrieve
            
        Returns:
            List[DatasetResponse]: All approved datasets associated with the user
            
        Example:
            >>> datasets = service.get_public_user_datasets(db, user_id=123)
            >>> print(f"User has {len(datasets)} public datasets")
        """
        # QUERY: Get only approved datasets where user is uploader OR owner
        datasets = self.repository.get_approved_by_user(db, user_id)
        return [self._format_dataset_response(dataset, db) for dataset in datasets]

    def search_datasets(self, db: Session, request: DatasetFilterRequest) -> DatasetListResponse:
        """Search datasets with filters."""
        try:
            # Convert request to internal filters
            internal_filters = DatasetFilterInternal(
                search_term=request.search_term,
                tags=request.tags,
                uploader_id=request.uploader_id,
                date_from=request.date_from,
                date_to=request.date_to,
                sort_by=request.sort_by,
                offset=(request.page - 1) * request.limit,
                limit=request.limit,
                file_types=request.file_types,
                has_location=request.has_location,
                min_downloads=request.min_downloads,
                max_downloads=request.max_downloads,
                approval_status=request.approval_status
            )
            
            # Get datasets from repository
            datasets, total_count = self.repository.get_filtered(db, internal_filters)
            
            # Convert to response models using the helper method that includes file types
            dataset_responses = [
                self._format_dataset_response(dataset, db)
                for dataset in datasets
            ]
            
            # Calculate pagination info
            has_next = (request.page * request.limit) < total_count
            has_prev = request.page > 1
            
            return DatasetListResponse(
                datasets=dataset_responses,
                total_count=total_count,
                page=request.page,
                limit=request.limit,
                has_next=has_next,
                has_prev=has_prev
            )
            
        except Exception as e:
            logger.error(f"Error searching datasets: {str(e)}")
            raise DatasetError(f"Failed to search datasets: {str(e)}")

    def add_owner(self, db: Session, dataset_id: int, request: OwnerActionRequest,
                  current_user_id: int) -> OwnerActionResponse:
        """
        Add a new owner to a dataset with validation and permission checking.
        
        This method manages dataset ownership relationships:
        1. Validates dataset and target user exist
        2. Checks permissions (only current owners/creator can add owners)
        3. Prevents duplicate ownership
        4. Adds the ownership relationship
        
        OWNERSHIP RULES:
        - Only dataset creators and existing owners can add new owners
        - Users cannot be added as owners multiple times
        - Target user must exist in the system
        
        Args:
            db: Database session for transaction management
            dataset_id: ID of dataset to add owner to
            request: Owner action request containing target user ID
            current_user_id: ID of user requesting the ownership change
            
        Returns:
            OwnerActionResponse: Success confirmation with dataset and user IDs
            
        Raises:
            DatasetNotFoundError: If dataset doesn't exist
            DatasetPermissionError: If current user lacks permission to modify owners
            DatasetValidationError: If target user doesn't exist
            DatasetOwnershipError: If user is already an owner
            
        Example:
            >>> request = OwnerActionRequest(user_id=456)
            >>> response = service.add_owner(db, dataset_id=123, request=request, current_user_id=789)
            >>> print(response.message)  # "Owner added successfully"
        """
        dataset = self.repository.get_by_id(db, dataset_id)
        if not dataset:
            raise DatasetNotFoundError(dataset_id)

        # PERMISSION CHECK: Only owners can modify ownership
        if not self._user_can_modify_dataset(dataset, current_user_id):
            raise DatasetPermissionError("User is not authorized to modify dataset owners")

        # VALIDATE TARGET USER EXISTS
        user = db.query(User).filter(User.user_id == request.user_id).first()
        if not user:
            raise DatasetValidationError("User not found")

        # PREVENT DUPLICATE OWNERSHIP
        if user in dataset.owners:
            raise DatasetOwnershipError("User is already an owner")

        try:
            # ADD OWNERSHIP RELATIONSHIP
            success = self.repository.add_owner(db, dataset_id, request.user_id)
            if success:
                db.commit()
                return OwnerActionResponse(
                    message="Owner added successfully",
                    dataset_id=dataset_id,
                    user_id=request.user_id
                )
            else:
                raise DatasetOwnershipError("Failed to add owner")

        except Exception as e:
            # TRANSACTION SAFETY: Rollback on any error
            db.rollback()
            logger.error(f"Error adding owner to dataset {dataset_id}: {str(e)}")
            raise

    def remove_owner(self, db: Session, dataset_id: int, request: OwnerActionRequest,
                     current_user_id: int) -> OwnerActionResponse:
        """
        Remove an owner from a dataset with validation and permission checking.
        
        This method manages removal of dataset ownership relationships:
        1. Validates dataset exists and target user is an owner
        2. Checks permissions (only current owners/creator can remove owners)
        3. Removes the ownership relationship
        4. Maintains referential integrity
        
        OWNERSHIP RULES:
        - Only dataset creators and existing owners can remove owners
        - Target user must currently be an owner
        - System maintains audit trail of ownership changes
        
        Args:
            db: Database session for transaction management
            dataset_id: ID of dataset to remove owner from
            request: Owner action request containing target user ID
            current_user_id: ID of user requesting the ownership change
            
        Returns:
            OwnerActionResponse: Success confirmation with dataset and user IDs
            
        Raises:
            DatasetNotFoundError: If dataset doesn't exist
            DatasetPermissionError: If current user lacks permission to modify owners
            DatasetOwnershipError: If target user is not currently an owner
            
        Example:
            >>> request = OwnerActionRequest(user_id=456)
            >>> response = service.remove_owner(db, dataset_id=123, request=request, current_user_id=789)
            >>> print(response.message)  # "Owner removed successfully"
        """
        dataset = self.repository.get_by_id(db, dataset_id)
        if not dataset:
            raise DatasetNotFoundError(dataset_id)

        # PERMISSION CHECK: Only owners can modify ownership
        if not self._user_can_modify_dataset(dataset, current_user_id):
            raise DatasetPermissionError("User is not authorized to modify dataset owners")

        # VALIDATE TARGET USER IS CURRENTLY AN OWNER
        user = db.query(User).filter(User.user_id == request.user_id).first()
        if not user or user not in dataset.owners:
            raise DatasetOwnershipError("User is not an owner of this dataset")

        try:
            # REMOVE OWNERSHIP RELATIONSHIP
            success = self.repository.remove_owner(db, dataset_id, request.user_id)
            if success:
                db.commit()
                return OwnerActionResponse(
                    message="Owner removed successfully",
                    dataset_id=dataset_id,
                    user_id=request.user_id
                )
            else:
                raise DatasetOwnershipError("Failed to remove owner")

        except Exception as e:
            # TRANSACTION SAFETY: Rollback on any error
            db.rollback()
            logger.error(f"Error removing owner from dataset {dataset_id}: {str(e)}")
            raise

    def get_dataset_stats(self, db: Session) -> DatasetStatsResponse:
        """
        Generate platform-wide dataset statistics for analytics and dashboards.
        
        This method provides comprehensive metrics about dataset usage and activity:
        - Total number of datasets in the platform
        - Total download count across all datasets
        - Recent activity metrics (datasets created this month)
        - Popular tags analysis for trending topics
        
        STATISTICS INCLUDED:
        - **Total Datasets**: Count of all datasets in the system
        - **Total Downloads**: Sum of all download counts across datasets
        - **Monthly Activity**: Datasets created in the current month
        - **Top Tags**: Most popular tags by usage frequency (limited to top 10)
        
        Args:
            db: Database session for query execution
            
        Returns:
            DatasetStatsResponse: Platform statistics including:
                - total_datasets: Overall dataset count
                - total_downloads: Sum of all downloads
                - datasets_this_month: Recent activity metric
                - top_tags: List of popular tags with usage counts
                
        Example:
            >>> stats = service.get_dataset_stats(db)
            >>> print(f"Platform has {stats.total_datasets} datasets")
            >>> print(f"Top tag: {stats.top_tags[0]['tag']} ({stats.top_tags[0]['count']} uses)")
        """
        # DELEGATE TO REPOSITORY: Statistics queries are data-access concerns
        stats = self.repository.get_stats(db)
        return DatasetStatsResponse(**stats)

    def get_public_stats(self, db: Session) -> PublicStatsResponse:
        """
        Get public platform statistics for homepage display.
        
        This method provides key metrics that are safe to display publicly
        without requiring authentication. It focuses on approved content only.
        
        Args:
            db: Database session for query execution
            
        Returns:
            PublicStatsResponse: Public statistics including total datasets,
                               researchers, and downloads
                               
        Example:
            >>> stats = service.get_public_stats(db)
            >>> print(f"Platform has {stats.total_datasets} datasets")
        """
        stats = self.repository.get_public_stats(db)
        return PublicStatsResponse(**stats)

    def get_available_file_types(self, db: Session) -> List[str]:
        """
        Get available file types for filtering, converted to user-friendly extensions.
        
        This method retrieves all unique file types from the database and converts
        MIME types to user-friendly file extensions for display in the UI.
        
        Args:
            db: Database session for query execution
            
        Returns:
            List[str]: List of user-friendly file extensions (e.g., ['csv', 'pdf', 'json'])
            
        Example:
            >>> file_types = service.get_available_file_types(db)
            >>> print(file_types)  # ['csv', 'pdf', 'json', 'xlsx']
        """
        # Get MIME types from database
        mime_types = self.repository.get_available_file_types(db)
        
        # Create mapping from MIME types to user-friendly extensions
        mime_to_extension = {
            'text/csv': 'csv',
            'application/csv': 'csv',
            'application/json': 'json',
            'text/json': 'json',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
            'application/vnd.ms-excel': 'xls',
            'application/pdf': 'pdf',
            'text/plain': 'txt',
            'application/xml': 'xml',
            'text/xml': 'xml',
            'application/zip': 'zip',
            'application/sql': 'sql',
            'text/sql': 'sql',
            'application/octet-stream': 'parquet',  # Common for parquet files
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
            'application/msword': 'doc',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
            'application/vnd.ms-powerpoint': 'ppt'
        }
        
        # Convert MIME types to extensions
        extensions = set()
        for mime_type in mime_types:
            if mime_type in mime_to_extension:
                extensions.add(mime_to_extension[mime_type])
            else:
                # For unknown MIME types, try to extract extension from MIME type
                if '/' in mime_type:
                    potential_ext = mime_type.split('/')[-1].lower()
                    # Only add if it looks like a reasonable file extension
                    if len(potential_ext) <= 10 and potential_ext.isalnum():
                        extensions.add(potential_ext)
        
        # Return sorted list of unique extensions
        return sorted(list(extensions))

    def get_search_suggestions(self, db: Session, search_term: str, limit: int = 8) -> List[str]:
        """
        Get search suggestions based on actual dataset data.
        
        This method provides intelligent autocomplete suggestions by searching through
        approved dataset names and descriptions. It's designed for public use and
        doesn't require authentication.
        
        BUSINESS LOGIC:
        - Only suggests from approved datasets (public content)
        - Validates minimum search term length (2 characters)
        - Limits suggestions for performance and UX
        - Returns relevant, unique suggestions
        
        Args:
            db: Database session for query execution
            search_term: User's partial search input
            limit: Maximum number of suggestions to return (default 8 for UI)
            
        Returns:
            List[str]: List of relevant search suggestions based on actual dataset names
            
        Raises:
            DatasetError: If there's an error retrieving suggestions
            
        Example:
            >>> suggestions = service.get_search_suggestions(db, "machine")
            >>> print(suggestions)  # ['Machine Learning Dataset', 'Agricultural Machines']
        """
        try:
            # VALIDATION: Ensure search term is meaningful
            if not search_term or len(search_term.strip()) < 2:
                return []
            
            # DELEGATE TO REPOSITORY: Data access layer handles the query
            return self.repository.get_search_suggestions(db, search_term.strip(), limit)
            
        except Exception as e:
            logger.error(f"Error getting search suggestions for '{search_term}': {str(e)}")
            # GRACEFUL DEGRADATION: Return empty list instead of failing
            return []

    def _user_can_modify_dataset(self, dataset: Dataset, user_id: int) -> bool:
        """
        Check if a user has permission to modify a specific dataset.
        
        This is a core permission validation method used throughout the service.
        It implements the business rules for dataset access control.
        
        PERMISSION RULES:
        - Dataset creator (uploader) can always modify their datasets
        - Users listed as dataset owners can modify the dataset
        - System admins have override permissions (checked at higher level)
        
        NOTE: This method only checks ownership-based permissions.
        Admin permissions are checked separately in calling methods.
        
        Args:
            dataset: Dataset model instance to check permissions for
            user_id: ID of user requesting access
            
        Returns:
            bool: True if user can modify the dataset, False otherwise
            
        Example:
            >>> can_modify = service._user_can_modify_dataset(dataset, user_id=123)
            >>> if can_modify:
            ...     print("User has modification permissions")
        """
        # CREATOR PERMISSION: Original uploader can always modify
        if dataset.uploader_id == user_id:
            return True
            
        # OWNER PERMISSION: Check if user is in the owners list
        return any(owner.user_id == user_id for owner in dataset.owners)

    def _format_dataset_response(self, dataset: Dataset, db: Session = None) -> DatasetResponse:
        """
        Convert a database model to an API response format.
        
        This method handles the transformation between internal database models
        and external API schemas. It ensures consistent data formatting and
        includes all necessary derived data.
        
        TRANSFORMATIONS PERFORMED:
        - Extracts owner IDs from relationship objects
        - Extracts tag names from tag relationship objects
        - Extracts approver name from approver relationship
        - Extracts file types from dataset files
        - Formats dates consistently
        - Handles optional fields gracefully
        
        Args:
            dataset: SQLAlchemy dataset model instance
            db: Database session for additional queries (optional)
            
        Returns:
            DatasetResponse: API-formatted dataset data ready for JSON serialization
            
        Example:
            >>> response = service._format_dataset_response(dataset_model, db)
            >>> print(response.file_types)  # ['csv', 'json', 'pdf']
        """
        # Extract approver name if available
        approved_by_name = None
        if dataset.approver:
            if dataset.approver.first_name and dataset.approver.last_name:
                approved_by_name = f"{dataset.approver.first_name} {dataset.approver.last_name}"
            else:
                approved_by_name = dataset.approver.username
        
        # Get file types for this dataset if db session is available
        file_types = []
        if db:
            try:
                file_types = self.repository.get_dataset_file_types(db, dataset.dataset_id)
            except Exception as e:
                logger.warning(f"Failed to get file types for dataset {dataset.dataset_id}: {str(e)}")
                file_types = []
        
        return DatasetResponse(
            dataset_id=dataset.dataset_id,
            dataset_name=dataset.dataset_name,
            dataset_description=dataset.dataset_description,
            downloads_count=dataset.downloads_count,
            uploader_id=dataset.uploader_id,
            date_of_creation=dataset.date_of_creation,
            dataset_last_updated=dataset.dataset_last_updated,
            # RELATIONSHIP EXTRACTION: Convert objects to simple ID lists
            owners=[owner.user_id for owner in dataset.owners],
            tags=[tag.tag_category_name for tag in dataset.tags],
            # APPROVAL FIELDS: Include approval status information and approver name
            approval_status=dataset.approval_status,
            approved_by=dataset.approved_by,
            approved_by_name=approved_by_name,
            approval_date=dataset.approval_date,
            # AGRICULTURAL RESEARCH CONTEXT FIELDS: Include location and time period
            geographic_location=dataset.geographic_location,
            data_time_period=dataset.data_time_period,
            # FILE INFORMATION: Include file types present in the dataset
            file_types=file_types
        ) 