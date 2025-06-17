from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session
from typing import List
import zipfile
import io
from fastapi.responses import StreamingResponse
import logging
from datetime import datetime

from backend.app.database.session import get_db
from backend.app.features.authentication.utils.authorizations import get_current_user
from backend.app.features.dataset.service import DatasetService
from backend.app.features.dataset.schemas.request import (
    DatasetCreateRequest, DatasetUpdateRequest, OwnerActionRequest, 
    BatchDeleteRequest, DatasetFilterRequest
)
from backend.app.features.dataset.schemas.response import (
    DatasetResponse, DatasetDetailResponse, DatasetListResponse,
    BatchDeleteResponse, OwnerActionResponse, DatasetStatsResponse,
    DatasetFileResponse, PublicStatsResponse
)
from backend.app.features.dataset.exceptions import DatasetError, handle_dataset_exception
from backend.app.features.dataset.utils import create_safe_filename
from backend.app.features.file.utils.upload import client, SUPABASE_STORAGE_BUCKET
from backend.app.features.file.services.download_tracking import DownloadTrackingService
from backend.app.database.models import File

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/datasets")

# Initialize service
dataset_service = DatasetService()


@router.post("/", response_model=DatasetResponse)
def create_dataset(
    dataset_in: DatasetCreateRequest, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new dataset."""
    try:
        # Ensure the current user is the uploader
        if dataset_in.uploader_id != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Can only create datasets for yourself")
        
        return dataset_service.create_dataset(db, dataset_in)
    except DatasetError as e:
        raise handle_dataset_exception(e)
    except Exception as e:
        logger.error(f"Unexpected error creating dataset: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/stats", response_model=DatasetStatsResponse)
def get_dataset_stats(db: Session = Depends(get_db)):
    """Get dataset statistics."""
    try:
        return dataset_service.get_dataset_stats(db)
    except Exception as e:
        logger.error(f"Unexpected error getting dataset stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/public-stats", response_model=PublicStatsResponse)
def get_public_stats(db: Session = Depends(get_db)):
    """Get public statistics for homepage display (no authentication required)."""
    try:
        return dataset_service.get_public_stats(db)
    except Exception as e:
        logger.error(f"Unexpected error getting public stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/available-file-types", response_model=List[str])
def get_available_file_types(db: Session = Depends(get_db)):
    """Get all available file types for filtering (no authentication required)."""
    try:
        return dataset_service.get_available_file_types(db)
    except Exception as e:
        logger.error(f"Unexpected error getting available file types: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/search-suggestions", response_model=List[str])
def get_search_suggestions(
    search_term: str = Query(..., min_length=2, max_length=100),
    limit: int = Query(8, ge=1, le=20),
    db: Session = Depends(get_db)
):
    """
    Get search suggestions based on dataset names and descriptions.
    
    This endpoint provides autocomplete suggestions for the search bar by searching
    through approved dataset names and descriptions. No authentication required.
    
    Args:
        search_term: Partial search term (minimum 2 characters)
        limit: Maximum number of suggestions to return (1-20, default 8)
        db: Database session
        
    Returns:
        List[str]: List of suggested search terms based on actual dataset data
        
    Example:
        GET /datasets/search-suggestions?search_term=machine&limit=5
        Returns: ["Machine Learning Dataset", "Agricultural Machines", ...]
    """
    try:
        return dataset_service.get_search_suggestions(db, search_term, limit)
    except Exception as e:
        logger.error(f"Unexpected error getting search suggestions: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/search", response_model=DatasetListResponse)
def search_datasets(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    search_term: str = None,
    tags: List[str] = Query(None),
    uploader_id: int = None,
    date_from: str = None,  # Date filter parameters
    date_to: str = None,    # Date filter parameters
    sort_by: str = "newest",
    page: int = 1,
    limit: int = 20,
    # Tier 1 filters
    file_types: List[str] = Query(None),
    has_location: bool = None,
    min_downloads: int = None,
    max_downloads: int = None,
    # Approval status filter
    approval_status: List[str] = Query(None)
):
    """Search and filter datasets with enhanced filtering capabilities."""
    try:
        # Convert date strings to datetime objects if provided
        date_from_dt = None
        date_to_dt = None
        
        if date_from:
            try:
                date_from_dt = datetime.fromisoformat(date_from)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid date format for date_from: {date_from}. Use YYYY-MM-DD format.")
        
        if date_to:
            try:
                date_to_dt = datetime.fromisoformat(date_to)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid date format for date_to: {date_to}. Use YYYY-MM-DD format.")
        
        # Create filter request
        filter_request = DatasetFilterRequest(
            search_term=search_term,
            tags=tags,
            uploader_id=uploader_id,
            date_from=date_from_dt,
            date_to=date_to_dt,
            sort_by=sort_by,
            page=page,
            limit=limit,
            file_types=file_types,
            has_location=has_location,
            min_downloads=min_downloads,
            max_downloads=max_downloads,
            approval_status=approval_status
        )
        
        # Get service and search
        service = DatasetService()
        result = service.search_datasets(db, filter_request)
        
        return result
        
    except Exception as e:
        return handle_dataset_exception(e)


@router.post("/batch-delete", response_model=BatchDeleteResponse)
def batch_delete_datasets(
    request_data: BatchDeleteRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete multiple datasets."""
    try:
        return dataset_service.batch_delete_datasets(db, request_data, current_user["user_id"])
    except DatasetError as e:
        raise handle_dataset_exception(e)
    except Exception as e:
        logger.error(f"Unexpected error in batch delete: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/user/{user_id}", response_model=List[DatasetResponse])
def get_user_datasets(
    user_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all datasets where the specified user is an uploader or owner."""
    try:
        return dataset_service.get_user_datasets(db, user_id, current_user["user_id"])
    except DatasetError as e:
        raise handle_dataset_exception(e)
    except Exception as e:
        logger.error(f"Unexpected error getting user datasets for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/user/{user_id}/public", response_model=List[DatasetResponse])
def get_public_user_datasets(
    user_id: int = Path(..., gt=0),
    db: Session = Depends(get_db)
):
    """Get only approved datasets where the specified user is an uploader or owner. No authentication required."""
    try:
        return dataset_service.get_public_user_datasets(db, user_id)
    except DatasetError as e:
        raise handle_dataset_exception(e)
    except Exception as e:
        logger.error(f"Unexpected error getting public user datasets for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{dataset_id}", response_model=DatasetResponse)
def get_dataset(
    dataset_id: int = Path(..., gt=0),
    db: Session = Depends(get_db)
):
    """Get a dataset by ID."""
    try:
        return dataset_service.get_dataset(db, dataset_id)
    except DatasetError as e:
        raise handle_dataset_exception(e)
    except Exception as e:
        logger.error(f"Unexpected error getting dataset {dataset_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{dataset_id}/detail", response_model=DatasetDetailResponse)
def get_dataset_detail(
    dataset_id: int = Path(..., gt=0),
    db: Session = Depends(get_db)
):
    """Get detailed dataset information including files and tags."""
    try:
        return dataset_service.get_dataset_detail(db, dataset_id)
    except DatasetError as e:
        raise handle_dataset_exception(e)
    except Exception as e:
        logger.error(f"Unexpected error getting dataset detail {dataset_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/{dataset_id}", response_model=DatasetResponse)
def update_dataset(
    dataset_in: DatasetUpdateRequest,
    dataset_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update a dataset."""
    try:
        return dataset_service.update_dataset(db, dataset_id, dataset_in, current_user["user_id"])
    except DatasetError as e:
        raise handle_dataset_exception(e)
    except Exception as e:
        logger.error(f"Unexpected error updating dataset {dataset_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/{dataset_id}", status_code=204)
def delete_dataset(
    dataset_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete a single dataset."""
    try:
        success = dataset_service.delete_dataset(db, dataset_id, current_user["user_id"])
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete dataset")
        return None  # 204 No Content
    except DatasetError as e:
        raise handle_dataset_exception(e)
    except Exception as e:
        logger.error(f"Unexpected error deleting dataset {dataset_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/{dataset_id}/add-owner", response_model=OwnerActionResponse)
def add_dataset_owner(
    owner_request: OwnerActionRequest,
    dataset_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Add an owner to a dataset."""
    try:
        return dataset_service.add_owner(db, dataset_id, owner_request, current_user["user_id"])
    except DatasetError as e:
        raise handle_dataset_exception(e)
    except Exception as e:
        logger.error(f"Unexpected error adding owner to dataset {dataset_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/{dataset_id}/remove-owner", response_model=OwnerActionResponse)
def remove_dataset_owner(
    owner_request: OwnerActionRequest,
    dataset_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Remove an owner from a dataset."""
    try:
        return dataset_service.remove_owner(db, dataset_id, owner_request, current_user["user_id"])
    except DatasetError as e:
        raise handle_dataset_exception(e)
    except Exception as e:
        logger.error(f"Unexpected error removing owner from dataset {dataset_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{dataset_id}/files", response_model=List[DatasetFileResponse])
def get_dataset_files(
    dataset_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all files for a specific dataset."""
    try:
        # First verify dataset exists
        dataset = dataset_service.get_dataset(db, dataset_id)
        
        # Get files through repository
        from backend.app.features.dataset.repository import DatasetRepository
        repository = DatasetRepository()
        files = repository.get_files(db, dataset_id)
        
        return [
            DatasetFileResponse(
                file_id=file_obj.file_id,
                file_name=file_obj.file_name,
                size=file_obj.size,
                file_type=file_obj.file_type,
                file_date_of_upload=file_obj.file_date_of_upload,
                file_url=file_obj.file_url,
                dataset_id=file_obj.dataset_id,
            )
            for file_obj in files
        ]
    except DatasetError as e:
        raise handle_dataset_exception(e)
    except Exception as e:
        logger.error(f"Unexpected error getting dataset files {dataset_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{dataset_id}/download")
def download_dataset(
    dataset_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Download all files in a dataset as a ZIP file."""
    try:
        # Get the dataset to ensure it exists
        dataset = dataset_service.get_dataset(db, dataset_id)
        
        # Get all files for the dataset
        from backend.app.features.dataset.repository import DatasetRepository
        repository = DatasetRepository()
        files = repository.get_files(db, dataset_id)
        
        if not files:
            raise HTTPException(status_code=404, detail="No files found in this dataset")
        
        # Create a zip file in memory
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            failed_files = []
            
            for file_obj in files:
                try:
                    # Download file from Supabase storage
                    file_bytes = client.storage.from_(SUPABASE_STORAGE_BUCKET).download(file_obj.file_url)
                    
                    # Add file to zip
                    zip_file.writestr(file_obj.file_name, file_bytes)
                    
                    logger.info(f"Successfully added {file_obj.file_name} to zip")
                    
                except Exception as e:
                    logger.error(f"Failed to download file {file_obj.file_name}: {str(e)}")
                    failed_files.append(file_obj.file_name)
                    continue
            
            # If there were failed files, add a log file to the zip
            if failed_files:
                error_log = f"The following files could not be downloaded:\n" + "\n".join(failed_files)
                zip_file.writestr("download_errors.txt", error_log.encode('utf-8'))
                logger.warning(f"Dataset {dataset_id} download completed with {len(failed_files)} failed files")
        
        zip_buffer.seek(0)
        
        # Create a safe filename for the zip
        zip_filename = f"{create_safe_filename(dataset.dataset_name, dataset_id)}.zip"
        
        # Track the download using the smart tracking service
        try:
            tracking_service = DownloadTrackingService()
            tracking_result = tracking_service.track_download(
                db=db,
                user_id=current_user["user_id"],
                dataset_id=dataset_id,
                download_type="dataset"
            )
            
            if tracking_result["is_first_download"]:
                logger.info(f"User {current_user['user_id']} first download of dataset {dataset_id} (full dataset)")
            else:
                logger.info(f"User {current_user['user_id']} repeat download of dataset {dataset_id} (full dataset)")
                
        except Exception as e:
            # Log the error but don't prevent the download
            logger.error(f"Error tracking dataset download for user {current_user['user_id']}, dataset {dataset_id}: {str(e)}")
        
        return StreamingResponse(
            io.BytesIO(zip_buffer.read()),
            media_type="application/zip",
            headers={"Content-Disposition": f'attachment; filename="{zip_filename}"'}
        )
        
    except DatasetError as e:
        raise handle_dataset_exception(e)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error creating dataset zip for dataset {dataset_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error creating dataset download: {str(e)}"
        )

