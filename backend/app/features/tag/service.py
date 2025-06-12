from typing import List, Optional
from sqlalchemy.orm import Session
from backend.app.database.models import Tag, User, DatasetTag
from backend.app.features.tag.schemas import TagCreate, TagUpdate, Tag as TagSchema, TagList
from backend.app.features.tag.exceptions import TagError, TagValidationError, TagPermissionError
import logging

logger = logging.getLogger(__name__)

class TagService:
    """
    Service layer for tag management operations.
    Handles business logic for tag creation, retrieval, updating, and deletion.
    
    BUSINESS RULES:
    - Only admin users can create, update, or delete tags
    - Tag names must be unique (case-insensitive)
    - Tag names are automatically converted to lowercase
    - Deleting a tag removes it from all associated datasets
    
    ADMIN PERMISSIONS:
    - All tag modification operations require admin role
    - Read operations (get_all_tags) are public for dataset selection
    """

    def _check_admin_permission(self, db: Session, current_user_id: int) -> User:
        """
        Verify that the user has admin permissions for tag operations.
        
        Args:
            db: Database session for user lookup
            current_user_id: ID of user to check permissions for
            
        Returns:
            User: The admin user if permissions are valid
            
        Raises:
            TagPermissionError: If user is not an admin
        """
        user = db.query(User).join(User.role).filter(User.user_id == current_user_id).first()
        if not user:
            raise TagPermissionError("User not found")
        
        if not user.role or user.role.role_name.lower() != 'admin':
            raise TagPermissionError("Only administrators can manage tags")
        
        return user

    def create_tag(self, db: Session, request: TagCreate, current_user_id: int) -> TagSchema:
        """
        Create a new tag with admin-only validation.
        
        This method handles the complete tag creation workflow:
        1. Validates that the current user is an admin
        2. Validates the tag name and converts to lowercase
        3. Checks for duplicate tags
        4. Creates the tag if it doesn't exist
        
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
            self._check_admin_permission(db, current_user_id)

            # STEP 2: Check if tag already exists (case-insensitive)
            existing_tag = db.query(Tag).filter(
                Tag.tag_category_name == request.tag_category_name
            ).first()
            
            if existing_tag:
                raise TagValidationError(f"Tag '{request.tag_category_name}' already exists")

            # STEP 3: Create the tag
            tag = Tag(tag_category_name=request.tag_category_name)
            db.add(tag)
            db.flush()  # Get the ID without committing
            
            # STEP 4: Commit the transaction
            db.commit()
            db.refresh(tag)

            logger.info(f"Tag '{request.tag_category_name}' created by admin user {current_user_id}")
            
            return TagSchema(
                tag_id=tag.tag_id,
                tag_category_name=tag.tag_category_name
            )

        except Exception as e:
            # TRANSACTION SAFETY: Rollback on any error
            db.rollback()
            logger.error(f"Error creating tag: {str(e)}")
            raise

    def get_all_tags(self, db: Session) -> TagList:
        """
        Get all tags in the system for dropdown selection.
        
        This is a public endpoint that doesn't require authentication,
        as users need to see available tags when uploading datasets.
        
        Args:
            db: Database session for query execution
            
        Returns:
            TagList: All tags with total count
        """
        try:
            tags = db.query(Tag).order_by(Tag.tag_category_name).all()
            
            return TagList(
                tags=[TagSchema(tag_id=tag.tag_id, tag_category_name=tag.tag_category_name) for tag in tags],
                total_count=len(tags)
            )
            
        except Exception as e:
            logger.error(f"Error retrieving tags: {str(e)}")
            raise TagError("Failed to retrieve tags")

    def update_tag(self, db: Session, tag_id: int, request: TagUpdate, current_user_id: int) -> TagSchema:
        """
        Update an existing tag with admin permission checking.
        
        Args:
            db: Database session for transaction management
            tag_id: ID of tag to update
            request: Updated tag data
            current_user_id: ID of admin user making the request
            
        Returns:
            TagSchema: Updated tag information
            
        Raises:
            TagPermissionError: If user is not an admin
            TagValidationError: If tag not found or new name already exists
        """
        try:
            # STEP 1: Validate admin permissions
            self._check_admin_permission(db, current_user_id)
            
            # STEP 2: Find the tag to update
            tag = db.query(Tag).filter(Tag.tag_id == tag_id).first()
            if not tag:
                raise TagValidationError(f"Tag with ID {tag_id} not found")
            
            # STEP 3: Check if new name conflicts with existing tag
            if request.tag_category_name != tag.tag_category_name:
                existing_tag = db.query(Tag).filter(
                    Tag.tag_category_name == request.tag_category_name,
                    Tag.tag_id != tag_id
                ).first()
                
                if existing_tag:
                    raise TagValidationError(f"Tag name '{request.tag_category_name}' is already taken")
            
            # STEP 4: Update the tag
            old_name = tag.tag_category_name
            tag.tag_category_name = request.tag_category_name
            
            db.commit()
            db.refresh(tag)
            
            logger.info(f"Tag updated from '{old_name}' to '{request.tag_category_name}' by admin user {current_user_id}")
            
            return TagSchema(
                tag_id=tag.tag_id,
                tag_category_name=tag.tag_category_name
            )
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error updating tag {tag_id}: {str(e)}")
            raise

    def delete_tag(self, db: Session, tag_id: int, current_user_id: int) -> dict:
        """
        Delete a tag and remove it from all associated datasets.
        
        This operation:
        1. Validates admin permissions
        2. Removes tag from all datasets (via DatasetTag relationship)
        3. Deletes the tag itself
        
        Args:
            db: Database session for transaction management
            tag_id: ID of tag to delete
            current_user_id: ID of admin user making the request
            
        Returns:
            dict: Deletion confirmation with details
            
        Raises:
            TagPermissionError: If user is not an admin
            TagValidationError: If tag not found
        """
        try:
            # STEP 1: Validate admin permissions
            self._check_admin_permission(db, current_user_id)
            
            # STEP 2: Find the tag to delete
            tag = db.query(Tag).filter(Tag.tag_id == tag_id).first()
            if not tag:
                raise TagValidationError(f"Tag with ID {tag_id} not found")
            
            # STEP 3: Count associated datasets for logging
            dataset_count = db.query(DatasetTag).filter(DatasetTag.tag_id == tag_id).count()
            
            # STEP 4: Delete all dataset associations (cascade will handle this)
            # The relationship is configured to cascade, so deleting the tag
            # will automatically remove DatasetTag entries
            tag_name = tag.tag_category_name
            db.delete(tag)
            
            db.commit()
            
            logger.info(f"Tag '{tag_name}' deleted by admin user {current_user_id}, removed from {dataset_count} datasets")
            
            return {
                "message": f"Tag '{tag_name}' successfully deleted",
                "tag_id": tag_id,
                "datasets_affected": dataset_count
            }
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error deleting tag {tag_id}: {str(e)}")
            raise

    def get_tag_by_id(self, db: Session, tag_id: int) -> Optional[TagSchema]:
        """
        Get a single tag by ID.
        
        Args:
            db: Database session for query execution
            tag_id: ID of tag to retrieve
            
        Returns:
            TagSchema or None: Tag information if found, None otherwise
        """
        try:
            tag = db.query(Tag).filter(Tag.tag_id == tag_id).first()
            if not tag:
                return None
            
            return TagSchema(
                tag_id=tag.tag_id,
                tag_category_name=tag.tag_category_name
            )
            
        except Exception as e:
            logger.error(f"Error retrieving tag {tag_id}: {str(e)}")
            raise TagError("Failed to retrieve tag") 