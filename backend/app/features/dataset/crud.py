"""
Dataset CRUD Layer - Legacy Compatibility and Migration Bridge

This module provides backwards compatibility for existing dataset CRUD operations
while migrating to the new service-layer architecture. It serves as a bridge
between old CRUD-style code and the new service-oriented approach.

BACKWARDS COMPATIBILITY STRATEGY:
├── **Wrapper Functions**: Old CRUD functions wrap new service methods
├── **Parameter Defaulting**: Missing parameters are handled gracefully
├── **Deprecation Warnings**: Logging alerts for deprecated usage patterns
├── **Gradual Migration**: Allows incremental adoption of new architecture
└── **Type Consistency**: Maintains return type compatibility with legacy code

ARCHITECTURE TRANSITION:
┌─────────────────────────┐
│   Legacy Code           │ ← Still uses CRUD functions
├─────────────────────────┤
│   CRUD Functions        │ ← THIS FILE: Compatibility wrappers
├─────────────────────────┤
│   Service Layer         │ ← New business logic layer
├─────────────────────────┤
│   Repository Layer      │ ← Data access layer
└─────────────────────────┘

KEY COMPATIBILITY FEATURES:
1. **Function Signatures**: Maintains original parameter names and types
2. **Return Values**: Converts service responses back to expected formats
3. **Error Handling**: Preserves original exception behaviors
4. **Logging**: Tracks usage of deprecated patterns for migration planning
5. **Safe Defaults**: Handles missing modern parameters (like current_user_id)

MIGRATION PATH:
1. **Phase 1**: CRUD functions wrap service calls (CURRENT STATE)
2. **Phase 2**: Direct service usage in new code, CRUD for legacy
3. **Phase 3**: Migrate remaining CRUD usage to service calls
4. **Phase 4**: Remove CRUD layer entirely

DEPRECATION POLICY:
- Functions without current_user_id generate warnings
- Safe defaults are provided to prevent immediate breakage
- Migration timeline allows gradual code updates
- Full removal planned for future major version

USAGE EXAMPLES:
    # Legacy usage (still supported with warnings)
    dataset = get_dataset_crud(db, dataset_id)
    
    # Modern usage (preferred)
    service = DatasetService()
    response = service.get_dataset(db, dataset_id)
"""
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException
from backend.app.database.models import Dataset, Tag, File, User
from backend.app.features.dataset.schemas import DatasetCreate, OwnerActionRequest
from backend.app.features.file.utils.upload import delete_file_from_storage
from backend.app.features.file.crud import delete_file_record
from typing import List
from datetime import datetime
import logging

from backend.app.features.dataset.repository import DatasetRepository
from backend.app.features.dataset.service import DatasetService
from backend.app.features.dataset.schemas.request import DatasetCreateRequest, DatasetUpdateRequest, OwnerActionRequest
from backend.app.features.dataset.schemas.internal import DatasetFilterInternal
from backend.app.features.dataset.exceptions import DatasetError, handle_dataset_exception

logger = logging.getLogger(__name__)

# SINGLETON INSTANCES FOR BACKWARDS COMPATIBILITY
# These are initialized once and reused across all CRUD function calls
# This approach maintains consistency while providing the new architecture benefits
_repository = DatasetRepository()
_service = DatasetService(_repository)


def create_dataset_crud(db: Session, dataset_in: DatasetCreateRequest):
    """
    Legacy CRUD function for dataset creation.
    
    This function provides backwards compatibility for existing code that uses
    the old CRUD pattern. It wraps the new service layer while maintaining
    the original function signature and behavior.
    
    COMPATIBILITY NOTES:
    - Maintains original parameter names and types
    - Returns service response directly (new behavior is compatible)
    - Handles service exceptions by converting to FastAPI HTTPExceptions
    
    Args:
        db: Database session (unchanged from legacy)
        dataset_in: Dataset creation request (now uses new schema)
        
    Returns:
        DatasetResponse: Service layer response (compatible with legacy expectations)
        
    Raises:
        HTTPException: Converted from service layer exceptions for API compatibility
        
    Migration Note:
        Consider using DatasetService.create_dataset() directly in new code.
    """
    try:
        return _service.create_dataset(db, dataset_in)
    except DatasetError as e:
        raise handle_dataset_exception(e)


def get_dataset_crud(db: Session, dataset_id: int):
    """
    Legacy CRUD function for dataset retrieval.
    
    This function bridges legacy code with the new service layer. It converts
    the service response back to a database model for backwards compatibility
    with code that expects SQLAlchemy model objects.
    
    BACKWARDS COMPATIBILITY:
    - Returns SQLAlchemy model (legacy expectation)
    - Service response is converted back to model using repository
    - Maintains error handling patterns
    
    Args:
        db: Database session
        dataset_id: Dataset identifier
        
    Returns:
        Dataset: SQLAlchemy model instance (legacy format)
        
    Raises:
        HTTPException: For consistency with legacy error handling
        
    Migration Note:
        New code should use DatasetService.get_dataset() which returns DatasetResponse.
    """
    try:
        response = _service.get_dataset(db, dataset_id)
        # Convert response back to model for backwards compatibility
        return _repository.get_by_id(db, dataset_id)
    except DatasetError as e:
        raise handle_dataset_exception(e)


def update_dataset_crud(db: Session, dataset_id: int, dataset_in: DatasetUpdateRequest, current_user_id: int = None):
    """
    Legacy CRUD function for dataset updates with backwards compatibility.
    
    This function demonstrates the deprecation pattern for functions that weren't
    designed with proper permission checking. It provides safe defaults while
    logging warnings to help track migration progress.
    
    DEPRECATION HANDLING:
    - Missing current_user_id triggers deprecation warning
    - Safe default: uses dataset uploader as the current user
    - Allows existing code to continue working during migration
    - Logs usage for migration planning
    
    Args:
        db: Database session
        dataset_id: Dataset to update
        dataset_in: Update request data
        current_user_id: User performing update (None triggers deprecation path)
        
    Returns:
        Dataset: SQLAlchemy model (legacy format)
        
    Raises:
        HTTPException: Converted service exceptions
        ValueError: If dataset not found during deprecation handling
        
    Migration Note:
        Always provide current_user_id in new code to avoid deprecation warnings.
    """
    try:
        if current_user_id is None:
            # DEPRECATION PATH: Handle legacy code that doesn't provide user context
            # This should be deprecated in favor of using the service directly
            logger.warning("update_dataset_crud called without current_user_id - this is deprecated")
            dataset = _repository.get_by_id(db, dataset_id)
            if dataset:
                current_user_id = dataset.uploader_id  # Default to uploader
            else:   
                raise ValueError("Dataset not found")
        
        response = _service.update_dataset(db, dataset_id, dataset_in, current_user_id)
        # Convert response back to model for backwards compatibility
        return _repository.get_by_id(db, dataset_id)
    except DatasetError as e:
        raise handle_dataset_exception(e)


def delete_dataset_crud(db: Session, dataset_id: int, current_user_id: int = None):
    """
    Legacy CRUD function for dataset deletion with deprecation handling.
    
    Similar to update, this function provides backwards compatibility for
    deletion operations while encouraging migration to the new pattern.
    
    SAFETY MEASURES:
    - Deprecation warning for missing user context
    - Safe default to dataset uploader (maintains original behavior)
    - Proper error propagation from service layer
    
    Args:
        db: Database session
        dataset_id: Dataset to delete
        current_user_id: User performing deletion (None triggers deprecation)
        
    Returns:
        bool: True if deletion successful
        
    Raises:
        HTTPException: Converted service exceptions
        ValueError: If dataset not found during deprecation handling
    """
    try:
        if current_user_id is None:
            # DEPRECATION PATH: Handle legacy code without permission context
            logger.warning("delete_dataset_crud called without current_user_id - this is deprecated")
            dataset = _repository.get_by_id(db, dataset_id)
            if dataset:
                current_user_id = dataset.uploader_id  # Default to uploader
            else:
                raise ValueError("Dataset not found")
        
        return _service.delete_dataset(db, dataset_id, current_user_id)
    except DatasetError as e:
        raise handle_dataset_exception(e)


def add_dataset_owner_crud(db: Session, dataset_id: int, owner_request: OwnerActionRequest, current_user_id: int):
    """
    Legacy CRUD function for adding dataset owners.
    
    This function wraps the service layer owner management functionality.
    It maintains the original API while providing the enhanced business logic
    and validation from the service layer.
    
    Args:
        db: Database session
        dataset_id: Dataset to add owner to
        owner_request: Owner action request with target user ID
        current_user_id: User requesting the change
        
    Returns:
        OwnerActionResponse: Service layer response
        
    Migration Note:
        This function signature already includes proper user context,
        so no deprecation warnings are needed.
    """
    try:
        return _service.add_owner(db, dataset_id, owner_request, current_user_id)
    except DatasetError as e:
        raise handle_dataset_exception(e)


def remove_dataset_owner_crud(db: Session, dataset_id: int, owner_request: OwnerActionRequest, current_user_id: int):
    """
    Legacy CRUD function for removing dataset owners.
    
    Wraps service layer functionality while maintaining original API compatibility.
    
    Args:
        db: Database session
        dataset_id: Dataset to remove owner from
        owner_request: Owner action request with target user ID
        current_user_id: User requesting the change
        
    Returns:
        OwnerActionResponse: Service layer response
    """
    try:
        return _service.remove_owner(db, dataset_id, owner_request, current_user_id)
    except DatasetError as e:
        raise handle_dataset_exception(e)


def get_user_datasets_crud(db: Session, user_id: int, current_user_id: int = None):
    """
    Legacy CRUD function for user dataset retrieval with privacy handling.
    
    This function demonstrates privacy-aware deprecation handling. It provides
    a reasonable default while maintaining security through service layer validation.
    
    PRIVACY AND DEPRECATION:
    - Missing current_user_id defaults to target user (allows self-access)
    - Service layer still enforces proper privacy checks
    - Deprecation warning helps identify code that needs updating
    
    Args:
        db: Database session
        user_id: User whose datasets to retrieve
        current_user_id: User making the request (None triggers deprecation)
        
    Returns:
        List[Dataset]: SQLAlchemy models (legacy format)
        
    Migration Note:
        Always provide current_user_id for proper privacy checking.
    """
    try:
        if current_user_id is None:
            # DEPRECATION PATH: For backwards compatibility, assume user can access their own datasets
            current_user_id = user_id
            logger.warning("get_user_datasets_crud called without current_user_id - defaulting to user_id")
        
        responses = _service.get_user_datasets(db, user_id, current_user_id)
        # Convert responses back to models for backwards compatibility
        return [_repository.get_by_id(db, response.dataset_id) for response in responses]
    except DatasetError as e:
        raise handle_dataset_exception(e)


def get_dataset_files_crud(db: Session, dataset_id: int):
    """
    Legacy CRUD function for dataset file retrieval.
    
    This function provides direct repository access for file listing,
    bypassing the service layer since file access doesn't require
    complex business logic or permission checking.
    
    DESIGN DECISION:
    - Direct repository usage for simple data access
    - Service layer not needed for basic file listing
    - Error handling maintains legacy patterns
    
    Args:
        db: Database session
        dataset_id: Dataset to get files for
        
    Returns:
        List[File]: SQLAlchemy file model instances
        
    Raises:
        HTTPException: If dataset not found
    """
    try:
        # Verify dataset exists first (basic validation)
        dataset = _repository.get_by_id(db, dataset_id)
        if not dataset:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        return _repository.get_files(db, dataset_id)
    except Exception as e:
        logger.error(f"Error getting dataset files: {str(e)}")
        raise


def batch_delete_datasets_crud(db: Session, dataset_ids: List[int], current_user_id: int):
    """
    Legacy CRUD function for batch dataset deletion.
    
    This function wraps the service layer batch operations while converting
    the response format for backwards compatibility with existing code.
    
    RESPONSE ADAPTATION:
    - Service returns structured BatchDeleteResponse
    - Legacy code expects simpler dictionary format
    - Conversion maintains backwards compatibility
    
    Args:
        db: Database session
        dataset_ids: List of dataset IDs to delete
        current_user_id: User requesting batch deletion
        
    Returns:
        dict: Legacy format with 'deleted_count' and 'errors' keys
        
    Migration Note:
        New code should use DatasetService.batch_delete_datasets() directly
        for more detailed response information.
    """
    try:
        from backend.app.features.dataset.schemas.request import BatchDeleteRequest
        request = BatchDeleteRequest(dataset_ids=dataset_ids)
        response = _service.batch_delete_datasets(db, request, current_user_id)
        
        # Convert to old format for backwards compatibility
        return {
            "deleted_count": response.deleted_count,
            "errors": response.errors
        }
    except DatasetError as e:
        raise handle_dataset_exception(e)


# DIRECT ACCESS FUNCTIONS FOR ADVANCED USAGE
# These functions provide access to the underlying service and repository
# for code that needs to work with the new architecture directly

def get_dataset_repository() -> DatasetRepository:
    """
    Get the dataset repository instance for advanced usage.
    
    This function provides access to the repository layer for code that needs
    direct database access without business logic. Use sparingly and prefer
    service layer methods when possible.
    
    Returns:
        DatasetRepository: Singleton repository instance
        
    Use Cases:
        - Performance-critical queries
        - Custom query requirements
        - Testing and development
        
    Warning:
        Direct repository usage bypasses business logic and validation.
        Use service layer methods for most operations.
    """
    return _repository


def get_dataset_service() -> DatasetService:
    """
    Get the dataset service instance for modern usage.
    
    This function provides access to the service layer for code that wants
    to migrate away from CRUD patterns while maintaining shared instances.
    
    Returns:
        DatasetService: Singleton service instance
        
    Migration Example:
        # Instead of CRUD function:
        # dataset = get_dataset_crud(db, dataset_id)
        
        # Use service directly:
        service = get_dataset_service()
        response = service.get_dataset(db, dataset_id)
    """
    return _service 