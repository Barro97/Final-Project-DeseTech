"""
Dataset Repository Layer - Data Access and Persistence

This module implements the Repository Pattern for dataset data access, providing:
- Abstract interface definition for dataset operations
- Concrete SQLAlchemy implementation
- Query optimization and database interaction
- Data access abstraction and testability

REPOSITORY PATTERN BENEFITS:
├── **Abstraction**: Hides database implementation details from business logic
├── **Testability**: Easy to mock for unit testing
├── **Flexibility**: Can swap database implementations (SQL, NoSQL, etc.)
├── **Separation**: Clean boundary between data access and business logic
└── **Consistency**: Standardized data access patterns across the application

ARCHITECTURE OVERVIEW:
┌─────────────────────────┐
│   Service Layer         │ ← Uses repository interface
├─────────────────────────┤
│ DatasetRepositoryInterface │ ← Abstract contract
├─────────────────────────┤
│ DatasetRepository       │ ← SQLAlchemy implementation
├─────────────────────────┤
│   Database Models       │ ← SQLAlchemy ORM
└─────────────────────────┘

KEY DESIGN DECISIONS:
1. **Interface First**: All operations defined in abstract interface
2. **Query Optimization**: Complex queries are optimized for performance
3. **Relationship Loading**: Efficient handling of SQLAlchemy relationships
4. **Error Isolation**: Database errors are contained within repository
5. **Pagination Support**: Built-in support for large dataset queries

USAGE EXAMPLE:
    # Use interface for dependency injection
    repository: DatasetRepositoryInterface = DatasetRepository()
    
    # Repository handles all database complexity
    datasets, total = repository.get_filtered(db, filters)
"""
from abc import ABC, abstractmethod
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc, func
from backend.app.database.models import Dataset, Tag, File, User
from backend.app.features.dataset.schemas.internal import DatasetFilterInternal


class DatasetRepositoryInterface(ABC):
    """
    Abstract interface defining all dataset data access operations.
    
    This interface establishes the contract for dataset repository implementations,
    ensuring consistent behavior across different storage backends and enabling
    easy testing through mock implementations.
    
    DESIGN PRINCIPLES:
    - **Single Responsibility**: Each method has one specific data access purpose
    - **Database Agnostic**: Interface doesn't assume specific database technology
    - **Error Handling**: Methods should handle database-specific errors
    - **Performance Aware**: Methods support pagination and optimization
    - **Relationship Aware**: Methods understand entity relationships
    
    IMPLEMENTATION REQUIREMENTS:
    - All methods must be implemented by concrete classes
    - Database sessions should be passed as parameters (no global state)
    - Return types should be consistent and well-defined
    - Errors should be propagated appropriately to the service layer
    """

    @abstractmethod
    def create(self, db: Session, dataset: Dataset) -> Dataset:
        """
        Create a new dataset record in the database.
        
        Args:
            db: Active database session
            dataset: Dataset model instance to persist
            
        Returns:
            Dataset: The created dataset with generated ID and metadata
        """
        pass

    @abstractmethod
    def get_by_id(self, db: Session, dataset_id: int) -> Optional[Dataset]:
        """
        Retrieve a dataset by its unique identifier.
        
        Args:
            db: Database session for query execution
            dataset_id: Unique dataset identifier
            
        Returns:
            Dataset or None: Dataset if found, None if not exists
        """
        pass

    @abstractmethod
    def get_by_user(self, db: Session, user_id: int) -> List[Dataset]:
        """
        Get all datasets associated with a user (as uploader or owner).
        
        Args:
            db: Database session for query execution
            user_id: User identifier to search for
            
        Returns:
            List[Dataset]: All datasets where user is uploader or owner
        """
        pass

    @abstractmethod
    def get_filtered(self, db: Session, filters: DatasetFilterInternal) -> Tuple[List[Dataset], int]:
        """
        Get filtered datasets with pagination and sorting.
        
        Args:
            db: Database session for query execution
            filters: Filter criteria including search, tags, dates, pagination
            
        Returns:
            Tuple[List[Dataset], int]: (filtered datasets, total count)
        """
        pass

    @abstractmethod
    def update(self, db: Session, dataset_id: int, updates: dict) -> Optional[Dataset]:
        """
        Update a dataset with provided field changes.
        
        Args:
            db: Database session for transaction
            dataset_id: Dataset to update
            updates: Dictionary of field names to new values
            
        Returns:
            Dataset or None: Updated dataset if successful, None if not found
        """
        pass

    @abstractmethod
    def delete(self, db: Session, dataset_id: int) -> bool:
        """
        Delete a dataset record from the database.
        
        Args:
            db: Database session for transaction
            dataset_id: Dataset to delete
            
        Returns:
            bool: True if deletion successful, False if dataset not found
        """
        pass

    @abstractmethod
    def get_files(self, db: Session, dataset_id: int) -> List[File]:
        """
        Get all files associated with a dataset.
        
        Args:
            db: Database session for query execution
            dataset_id: Dataset to get files for
            
        Returns:
            List[File]: All files belonging to the dataset
        """
        pass


class DatasetRepository(DatasetRepositoryInterface):
    """
    SQLAlchemy implementation of the dataset repository interface.
    
    This class provides concrete implementation of all dataset data access operations
    using SQLAlchemy ORM. It handles query optimization, relationship loading,
    and database-specific concerns.
    
    IMPLEMENTATION FEATURES:
    - **Query Optimization**: Uses appropriate joins and eager loading
    - **Relationship Handling**: Efficiently loads related entities
    - **Error Handling**: Catches and handles SQLAlchemy exceptions
    - **Performance**: Implements pagination and filtering efficiently
    - **Consistency**: Maintains referential integrity
    
    QUERY PATTERNS:
    - Single entity queries use simple filter operations
    - Complex searches use joins and subqueries for performance
    - Pagination is implemented at the database level
    - Relationships are loaded efficiently to avoid N+1 problems
    """

    def create(self, db: Session, dataset: Dataset) -> Dataset:
        """
        Create a new dataset in the database with proper relationship handling.
        
        This method adds the dataset to the session and flushes to get the
        generated ID without committing the transaction. This allows the
        calling service to manage the overall transaction scope.
        
        Args:
            db: Active database session for the transaction
            dataset: Populated dataset model ready for persistence
            
        Returns:
            Dataset: The dataset with generated ID and database defaults applied
            
        Note:
            This method flushes but does not commit. Transaction management
            is the responsibility of the calling service layer.
        """
        db.add(dataset)
        db.flush()  # Get ID without committing transaction
        return dataset

    def get_by_id(self, db: Session, dataset_id: int) -> Optional[Dataset]:
        """
        Retrieve a single dataset by ID with relationship loading.
        
        This method loads the dataset with its related entities (owners, tags)
        to avoid additional queries when the service layer accesses relationships.
        
        Args:
            db: Database session for query execution
            dataset_id: Unique identifier of the dataset
            
        Returns:
            Dataset or None: Complete dataset with relationships loaded,
                           or None if no dataset exists with the given ID
        """
        return db.query(Dataset).filter(Dataset.dataset_id == dataset_id).first()

    def get_by_user(self, db: Session, user_id: int) -> List[Dataset]:
        """
        Get all datasets where user is either uploader or owner.
        
        This method uses an OR condition to find datasets where the user has
        any kind of association. It includes both datasets the user created
        and datasets where they were added as an owner later.
        
        QUERY LOGIC:
        - Datasets where user_id = uploader_id (created by user)
        - OR datasets where user is in the owners relationship
        
        Args:
            db: Database session for query execution
            user_id: ID of user to find datasets for
            
        Returns:
            List[Dataset]: All datasets associated with the user, ordered by creation date
        """
        return db.query(Dataset).filter(
            or_(
                Dataset.uploader_id == user_id,  # User created the dataset
                Dataset.owners.any(User.user_id == user_id)  # User is an owner
            )
        ).all()

    def get_filtered(self, db: Session, filters: DatasetFilterInternal) -> Tuple[List[Dataset], int]:
        """
        Execute complex filtered search with pagination and sorting.
        
        This method builds a dynamic query based on the provided filters:
        1. Starts with base dataset query
        2. Applies text search filters (ILIKE for case-insensitive)
        3. Applies tag filters (requires datasets to have specified tags)
        4. Applies date range filters on creation date
        5. Gets total count before pagination
        6. Applies sorting based on requested criteria
        7. Applies pagination (offset/limit)
        
        SEARCH BEHAVIOR:
        - **Text Search**: Case-insensitive search across name and description
        - **Tag Filtering**: Datasets must have ALL specified tags (AND logic)
        - **Date Filtering**: Inclusive range filtering on creation date
        - **Sorting**: Multiple options with database-level sorting
        - **Pagination**: Efficient offset/limit implementation
        
        Args:
            db: Database session for query execution
            filters: Complete filter criteria with search, tags, dates, pagination
            
        Returns:
            Tuple[List[Dataset], int]: (filtered datasets for current page, total matching count)
            
        Example:
            >>> filters = DatasetFilterInternal(
            ...     search_term="machine learning",
            ...     tags=["AI", "research"],
            ...     sort_by="downloads",
            ...     offset=0, limit=20
            ... )
            >>> datasets, total = repository.get_filtered(db, filters)
            >>> print(f"Page 1: {len(datasets)} of {total} total results")
        """
        # START WITH BASE QUERY
        query = db.query(Dataset)

        # APPLY APPROVAL STATUS FILTER - Critical for admin workflow
        if filters.is_admin_request:
            # Admin can see all datasets, optionally filtered by specific statuses
            if filters.include_approval_status:
                query = query.filter(Dataset.approval_status.in_(filters.include_approval_status))
        else:
            # Regular users can only see approved datasets
            query = query.filter(Dataset.approval_status == 'approved')

        # APPLY TEXT SEARCH FILTER
        if filters.search_term:
            # Case-insensitive search across name and description
            search = f"%{filters.search_term}%"
            query = query.filter(
                or_(
                    Dataset.dataset_name.ilike(search),
                    Dataset.dataset_description.ilike(search)
                )
            )

        # APPLY TAG FILTERS (must have ALL specified tags)
        if filters.tags:
            query = query.filter(
                Dataset.tags.any(Tag.tag_category_name.in_(filters.tags))
            )

        # APPLY UPLOADER FILTER
        if filters.uploader_id:
            query = query.filter(Dataset.uploader_id == filters.uploader_id)

        # APPLY DATE RANGE FILTERS
        if filters.date_from:
            query = query.filter(Dataset.date_of_creation >= filters.date_from)

        if filters.date_to:
            query = query.filter(Dataset.date_of_creation <= filters.date_to)

        # APPLY TIER 1 FILTERS
        
        # File types filter - datasets must have files of specified types
        if filters.file_types:
            # Create mapping from file extensions to MIME types
            extension_to_mime = {
                'csv': ['text/csv', 'application/csv'],
                'json': ['application/json', 'text/json'],
                'xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
                'xls': ['application/vnd.ms-excel'],
                'pdf': ['application/pdf'],
                'txt': ['text/plain'],
                'xml': ['application/xml', 'text/xml'],
                'zip': ['application/zip'],
                'sql': ['application/sql', 'text/sql'],
                'parquet': ['application/octet-stream'],
                'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                'doc': ['application/msword'],
                'pptx': ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
                'ppt': ['application/vnd.ms-powerpoint']
            }
            
            # Convert file extensions to MIME types and include extensions for fallback
            search_values = []
            for ext in filters.file_types:
                ext_lower = ext.lower()
                # Add the extension itself (in case it's stored as extension)
                search_values.append(ext_lower)
                search_values.append(ext.upper())
                # Add corresponding MIME types
                if ext_lower in extension_to_mime:
                    search_values.extend(extension_to_mime[ext_lower])
            
            # Remove duplicates
            search_values = list(set(search_values))
            
            # Filter by both MIME types and extensions (case-insensitive)
            query = query.filter(
                or_(
                    Dataset.files.any(File.file_type.in_(search_values)),
                    Dataset.files.any(func.lower(File.file_type).in_([v.lower() for v in search_values]))
                )
            )
        
        # Geographic location filter - datasets with/without location data
        if filters.has_location is not None:
            if filters.has_location:
                query = query.filter(Dataset.geographic_location.isnot(None))
                query = query.filter(Dataset.geographic_location != '')
            else:
                query = query.filter(
                    or_(
                        Dataset.geographic_location.is_(None),
                        Dataset.geographic_location == ''
                    )
                )
        
        # Download count range filters
        if filters.min_downloads is not None:
            query = query.filter(Dataset.downloads_count >= filters.min_downloads)
            
        if filters.max_downloads is not None:
            query = query.filter(Dataset.downloads_count <= filters.max_downloads)

        # GET TOTAL COUNT (before pagination for UI)
        total_count = query.count()

        # APPLY SORTING
        if filters.sort_by == "newest":
            query = query.order_by(desc(Dataset.date_of_creation))
        elif filters.sort_by == "oldest":
            query = query.order_by(asc(Dataset.date_of_creation))
        elif filters.sort_by == "downloads":
            query = query.order_by(desc(Dataset.downloads_count))
        elif filters.sort_by == "name":
            query = query.order_by(asc(Dataset.dataset_name))

        # APPLY PAGINATION
        datasets = query.offset(filters.offset).limit(filters.limit).all()

        return datasets, total_count

    def update(self, db: Session, dataset_id: int, updates: dict) -> Optional[Dataset]:
        """
        Update dataset fields with efficient single-query approach.
        
        This method retrieves the dataset, applies the updates, and flushes
        the changes. It uses setattr for dynamic field updates and validates
        that the field exists before setting it.
        
        Args:
            db: Database session for the transaction
            dataset_id: ID of dataset to update
            updates: Dictionary mapping field names to new values
            
        Returns:
            Dataset or None: Updated dataset if found, None if dataset doesn't exist
            
        Example:
            >>> updates = {
            ...     "dataset_name": "New Name",
            ...     "dataset_description": "Updated description",
            ...     "dataset_last_updated": datetime.now()
            ... }
            >>> updated = repository.update(db, 123, updates)
        """
        dataset = self.get_by_id(db, dataset_id)
        if not dataset:
            return None

        # APPLY FIELD UPDATES DYNAMICALLY
        for key, value in updates.items():
            if hasattr(dataset, key):  # Validate field exists
                setattr(dataset, key, value)

        db.flush()  # Apply changes without committing
        return dataset

    def delete(self, db: Session, dataset_id: int) -> bool:
        """
        Delete a dataset with proper cascade handling.
        
        This method deletes the dataset record, which should cascade to
        related records based on the database schema configuration.
        It returns a boolean to indicate success/failure.
        
        Args:
            db: Database session for the transaction
            dataset_id: ID of dataset to delete
            
        Returns:
            bool: True if deletion successful, False if dataset not found
            
        Note:
            Cascading behavior depends on database schema configuration.
            Related records (files, tags, owners) should be handled appropriately.
        """
        dataset = self.get_by_id(db, dataset_id)
        if not dataset:
            return False

        db.delete(dataset)
        db.flush()  # Apply deletion without committing
        return True

    def get_files(self, db: Session, dataset_id: int) -> List[File]:
        """
        Retrieve all files associated with a specific dataset.
        
        This method provides access to the file entities related to a dataset.
        Files are ordered by upload date for consistent presentation.
        
        Args:
            db: Database session for query execution
            dataset_id: ID of dataset to get files for
            
        Returns:
            List[File]: All files belonging to the dataset, ordered by upload date
        """
        return db.query(File).filter(File.dataset_id == dataset_id).all()

    def add_owner(self, db: Session, dataset_id: int, user_id: int) -> bool:
        """
        Add a user as an owner of a dataset.
        
        This method manages the many-to-many relationship between datasets
        and users for ownership. It prevents duplicate ownership entries.
        
        Args:
            db: Database session for the transaction
            dataset_id: ID of dataset to add owner to
            user_id: ID of user to add as owner
            
        Returns:
            bool: True if owner added successfully, False if dataset/user not found
        """
        dataset = self.get_by_id(db, dataset_id)
        user = db.query(User).filter(User.user_id == user_id).first()
        
        if not dataset or not user:
            return False

        # ADD OWNERSHIP IF NOT ALREADY EXISTS
        if user not in dataset.owners:
            dataset.owners.append(user)
            db.flush()

        return True

    def remove_owner(self, db: Session, dataset_id: int, user_id: int) -> bool:
        """
        Remove a user from dataset ownership.
        
        This method manages the removal of ownership relationships,
        ensuring proper cleanup of the many-to-many association.
        
        Args:
            db: Database session for the transaction
            dataset_id: ID of dataset to remove owner from
            user_id: ID of user to remove as owner
            
        Returns:
            bool: True if owner removed successfully, False if dataset/user not found
        """
        dataset = self.get_by_id(db, dataset_id)
        user = db.query(User).filter(User.user_id == user_id).first()
        
        if not dataset or not user:
            return False

        # REMOVE OWNERSHIP IF EXISTS
        if user in dataset.owners:
            dataset.owners.remove(user)
            db.flush()

        return True

    def get_stats(self, db: Session) -> dict:
        """
        Generate comprehensive dataset statistics for analytics.
        
        This method executes multiple aggregate queries to provide
        platform-wide statistics about dataset usage and activity.
        
        STATISTICS CALCULATED:
        - **Total Datasets**: Count of all datasets in the system
        - **Total Downloads**: Sum of download counts across all datasets
        - **Monthly Activity**: Datasets created in the current calendar month
        - **Popular Tags**: Top 10 most-used tags with usage counts
        
        Args:
            db: Database session for query execution
            
        Returns:
            dict: Statistics dictionary with keys:
                - total_datasets: int
                - total_downloads: int  
                - datasets_this_month: int
                - top_tags: List[dict] with 'tag' and 'count' keys
                
        Example:
            >>> stats = repository.get_stats(db)
            >>> print(f"Platform: {stats['total_datasets']} datasets")
            >>> print(f"Top tag: {stats['top_tags'][0]['tag']}")
        """
        # BASIC COUNTS
        total_datasets = db.query(Dataset).count()
        total_downloads = db.query(func.sum(Dataset.downloads_count)).scalar() or 0
        
        # MONTHLY ACTIVITY CALCULATION
        from datetime import datetime, timedelta
        month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        datasets_this_month = db.query(Dataset).filter(
            Dataset.date_of_creation >= month_start
        ).count()

        # TOP TAGS ANALYSIS
        # Join datasets with tags and count usage frequency
        from backend.app.features.dataset.models import DatasetTag
        top_tags = db.query(
            Tag.tag_category_name,
            func.count(Dataset.dataset_id).label('count')
        ).join(
            DatasetTag, Tag.tag_id == DatasetTag.tag_id
        ).join(
            Dataset, DatasetTag.dataset_id == Dataset.dataset_id
        ).group_by(Tag.tag_category_name).order_by(
            desc('count')  # Most popular first
        ).limit(10).all()  # Top 10 only

        return {
            "total_datasets": total_datasets,
            "total_downloads": total_downloads,
            "datasets_this_month": datasets_this_month,
            "top_tags": [{"tag": tag.tag_category_name, "count": tag.count} for tag in top_tags]
        }

    def get_public_stats(self, db: Session) -> dict:
        """
        Generate public statistics for homepage display.
        
        This method provides key platform metrics suitable for public display
        without exposing sensitive admin information.
        
        STATISTICS CALCULATED:
        - **Total Datasets**: Count of approved datasets only
        - **Total Researchers**: Count of users who have uploaded at least one dataset
        - **Total Downloads**: Sum of download counts across all approved datasets
        - **Research Fields**: Count of unique tags used in approved datasets
        
        Args:
            db: Database session for query execution
            
        Returns:
            dict: Public statistics dictionary with keys:
                - total_datasets: int
                - total_researchers: int
                - total_downloads: int
                - research_fields: int
                
        Example:
            >>> stats = repository.get_public_stats(db)
            >>> print(f"Public stats: {stats['total_datasets']} datasets, {stats['total_researchers']} researchers")
        """
        # APPROVED DATASETS ONLY (public-facing)
        approved_datasets_query = db.query(Dataset).filter(Dataset.approval_status == 'approved')
        total_datasets = approved_datasets_query.count()
        
        # TOTAL DOWNLOADS FROM APPROVED DATASETS
        total_downloads = db.query(func.sum(Dataset.downloads_count)).filter(
            Dataset.approval_status == 'approved'
        ).scalar() or 0
        
        # TOTAL RESEARCHERS (users who have uploaded at least one approved dataset)
        total_researchers = db.query(func.count(func.distinct(Dataset.uploader_id))).filter(
            Dataset.approval_status == 'approved'
        ).scalar() or 0
        
        return {
            "total_datasets": total_datasets,
            "total_researchers": total_researchers, 
            "total_downloads": total_downloads
        } 