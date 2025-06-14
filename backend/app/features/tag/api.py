from fastapi import APIRouter, Depends, HTTPException, status, Path
from sqlalchemy.orm import Session
from typing import List
import logging

from backend.app.database.session import get_db
from backend.app.features.authentication.utils.authorizations import get_current_user
from backend.app.features.tag.service import TagService
from backend.app.features.tag.schemas import TagCreate, TagUpdate, Tag as TagSchema, TagList
from backend.app.features.tag.exceptions import TagError, handle_tag_exception

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/tags", tags=["tags"])

# Initialize service
tag_service = TagService()

@router.post("/", response_model=TagSchema, status_code=status.HTTP_201_CREATED)
def create_tag(
    tag: TagCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new tag (admin only).
    
    This endpoint allows administrators to create new tags in the system.
    The tag name will be automatically converted to lowercase for consistency.
    
    Args:
        tag: Tag creation request containing the tag name
        db: Database session
        current_user: Current authenticated user (from token)
        
    Returns:
        TagSchema: Created tag information
        
    Raises:
        HTTPException: 
            - 403 if user is not an admin
            - 400 if tag name is invalid or already exists
            - 500 for internal server errors
    """
    try:
        return tag_service.create_tag(db, tag, current_user["user_id"])
    except TagError as e:
        raise handle_tag_exception(e)
    except Exception as e:
        logger.error(f"Unexpected error creating tag: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/", response_model=TagList)
def get_all_tags(db: Session = Depends(get_db)):
    """
    Get all tags in the system.
    
    This endpoint is public (no authentication required) as users need
    to see available tags when uploading or editing datasets.
    
    Args:
        db: Database session
        
    Returns:
        TagList: All tags with total count
        
    Raises:
        HTTPException: 500 for internal server errors
    """
    try:
        return tag_service.get_all_tags(db)
    except TagError as e:
        raise handle_tag_exception(e)
    except Exception as e:
        logger.error(f"Unexpected error retrieving tags: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/used", response_model=TagList)
def get_used_tags(db: Session = Depends(get_db)):
    """
    Get only tags that are associated with at least one dataset.
    
    This endpoint returns tags that are actually being used by datasets,
    filtering out any tags that exist in the database but aren't
    associated with any datasets. This is useful for filtering
    interfaces where showing unused tags would result in empty results.
    
    Args:
        db: Database session
        
    Returns:
        TagList: Only tags that have associated datasets, with total count
        
    Raises:
        HTTPException: 500 for internal server errors
    """
    try:
        return tag_service.get_used_tags(db)
    except TagError as e:
        raise handle_tag_exception(e)
    except Exception as e:
        logger.error(f"Unexpected error retrieving used tags: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/{tag_id}", response_model=TagSchema)
def get_tag_by_id(
    tag_id: int = Path(..., gt=0),
    db: Session = Depends(get_db)
):
    """
    Get a specific tag by ID.
    
    Args:
        tag_id: ID of the tag to retrieve
        db: Database session
        
    Returns:
        TagSchema: Tag information
        
    Raises:
        HTTPException: 
            - 404 if tag not found
            - 500 for internal server errors
    """
    try:
        tag = tag_service.get_tag_by_id(db, tag_id)
        if not tag:
            raise HTTPException(status_code=404, detail=f"Tag with ID {tag_id} not found")
        return tag
    except HTTPException:
        raise
    except TagError as e:
        raise handle_tag_exception(e)
    except Exception as e:
        logger.error(f"Unexpected error retrieving tag {tag_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/{tag_id}", response_model=TagSchema)
def update_tag(
    tag_update: TagUpdate,
    tag_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Update an existing tag (admin only).
    
    This endpoint allows administrators to update tag names.
    The new tag name will be validated for uniqueness.
    
    Args:
        tag_update: Updated tag information
        tag_id: ID of the tag to update
        db: Database session
        current_user: Current authenticated user (from token)
        
    Returns:
        TagSchema: Updated tag information
        
    Raises:
        HTTPException:
            - 403 if user is not an admin
            - 404 if tag not found
            - 400 if new tag name already exists
            - 500 for internal server errors
    """
    try:
        return tag_service.update_tag(db, tag_id, tag_update, current_user["user_id"])
    except TagError as e:
        raise handle_tag_exception(e)
    except Exception as e:
        logger.error(f"Unexpected error updating tag {tag_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/{tag_id}")
def delete_tag(
    tag_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a tag (admin only).
    
    This endpoint allows administrators to delete tags from the system.
    Deleting a tag will remove it from all associated datasets.
    
    Args:
        tag_id: ID of the tag to delete
        db: Database session
        current_user: Current authenticated user (from token)
        
    Returns:
        dict: Deletion confirmation with details
        
    Raises:
        HTTPException:
            - 403 if user is not an admin
            - 404 if tag not found
            - 500 for internal server errors
    """
    try:
        return tag_service.delete_tag(db, tag_id, current_user["user_id"])
    except TagError as e:
        raise handle_tag_exception(e)
    except Exception as e:
        logger.error(f"Unexpected error deleting tag {tag_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error") 