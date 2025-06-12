from typing import List, Optional
from sqlalchemy.orm import Session
from backend.app.database.models import Tag, User
from backend.app.features.tag.schemas import TagCreate, Tag as TagSchema
from backend.app.features.tag.exceptions import TagError, TagValidationError, TagPermissionError
import logging

logger = logging.getLogger(__name__)

class TagService:
    """
    Service layer for tag management operations.
    Handles business logic for tag creation, retrieval, and validation.
    """

    def create_tag(self, db: Session, request: TagCreate, current_user_id: int) -> TagSchema:
        """
        Create a new tag with admin-only validation.
        
        This method handles the complete tag creation workflow:
        1. Validates that the current user is an admin
        2. Validates the tag name
        3. Checks for duplicate tags
        4. Creates the tag if it doesn't exist
        
        BUSINESS RULES:
        - Only admin users can create tags
        - Tag names must be unique
        - Tag names must be properly sanitized
        
        Args:
            db: Database session for transaction management
            request: Validated tag creation request with name
            current_user_id: ID of user requesting the tag creation
            
        Returns:
            TagSchema: Complete tag information including generated ID
            
        Raises:
            TagPermissionError: If user is not an admin
            TagValidationError: If tag name is invalid or already exists
            TagError: If creation fails due to database constraints
        """
        try:
            # STEP 1: Validate that the user is an admin
            user = db.query(User).filter(User.user_id == current_user_id).first()
            if not user or not user.role or user.role.role_name != "admin":
                raise TagPermissionError("Only administrators can create tags")

            # STEP 2: Check if tag already exists
            existing_tag = db.query(Tag).filter(
                Tag.tag_category_name == request.tag_category_name.lower()
            ).first()
            
            if existing_tag:
                raise TagValidationError(f"Tag '{request.tag_category_name}' already exists")

            # STEP 3: Create the tag
            tag = Tag(tag_category_name=request.tag_category_name.lower())
            db.add(tag)
            db.flush()  # Get the ID without committing
            
            # STEP 4: Commit the transaction
            db.commit()
            db.refresh(tag)

            return TagSchema(
                tag_id=tag.tag_id,
                tag_category_name=tag.tag_category_name
            )

        except Exception as e:
            # TRANSACTION SAFETY: Rollback on any error
            db.rollback()
            logger.error(f"Error creating tag: {str(e)}")
            raise 