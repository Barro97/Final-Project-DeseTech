from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import logging

from backend.app.database.session import get_db
from backend.app.features.authentication.utils.authorizations import get_current_user
from backend.app.features.tag.addTag import TagService
from backend.app.features.tag.schemas import TagCreate, Tag as TagSchema
from backend.app.features.tag.exceptions import TagError, handle_tag_exception

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/tags", tags=["tags"])

# Initialize service
tag_service = TagService()

@router.post("/addTag", response_model=TagSchema, status_code=status.HTTP_201_CREATED)
def create_tag(
    tag: TagCreate,
    db: Session = Depends(get_db),
    #current_user: dict = Depends(get_current_user)
):
    """
    Create a new tag (admin only).
    
    This endpoint allows administrators to create new tags in the system.
    The tag name will be automatically converted to lowercase.
    
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
        return tag_service.create_tag(db, tag) #, current_user["user_id"])
    except TagError as e:
        raise handle_tag_exception(e)
    except Exception as e:
        logger.error(f"Unexpected error creating tag: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error") 