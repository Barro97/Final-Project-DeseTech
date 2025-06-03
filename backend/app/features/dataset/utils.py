from typing import List
from sqlalchemy.orm import Session
from backend.app.database.models import Tag
from backend.app.features.dataset.exceptions import DatasetValidationError
import re


def handle_dataset_tags(db: Session, tag_names: List[str]) -> List[Tag]:
    """
    Handle tag creation and retrieval for datasets.
    Creates new tags if they don't exist.
    
    Args:
        db: Database session
        tag_names: List of tag names to process
        
    Returns:
        List of Tag objects
    """
    if not tag_names:
        return []
    
    tag_objects = []
    for tag_name in tag_names:
        # Validate and sanitize tag name
        sanitized_name = sanitize_tag_name(tag_name)
        if not sanitized_name:
            continue
            
        # Check if tag exists
        tag = db.query(Tag).filter_by(tag_category_name=sanitized_name).first()
        if not tag:
            # Create new tag
            tag = Tag(tag_category_name=sanitized_name)
            db.add(tag)
            db.flush()  # Flush to get ID without committing
        tag_objects.append(tag)
    
    return tag_objects


def sanitize_tag_name(tag_name: str) -> str:
    """
    Sanitize and validate tag names.
    
    Args:
        tag_name: Raw tag name
        
    Returns:
        Sanitized tag name or empty string if invalid
    """
    if not tag_name or not isinstance(tag_name, str):
        return ""
    
    # Remove extra whitespace and convert to lowercase
    sanitized = tag_name.strip().lower()
    
    # Remove special characters except hyphens and underscores
    sanitized = re.sub(r'[^a-z0-9\-_\s]', '', sanitized)
    
    # Replace multiple spaces with single spaces
    sanitized = re.sub(r'\s+', ' ', sanitized)
    
    # Validate length
    if len(sanitized) < 2 or len(sanitized) > 50:
        return ""
    
    return sanitized


def validate_dataset_name(name: str) -> str:
    """
    Validate and sanitize dataset name.
    
    Args:
        name: Dataset name to validate
        
    Returns:
        Sanitized dataset name
        
    Raises:
        DatasetValidationError: If name is invalid
    """
    if not name or not isinstance(name, str):
        raise DatasetValidationError("Dataset name is required")
    
    sanitized = name.strip()
    
    if len(sanitized) < 3:
        raise DatasetValidationError("Dataset name must be at least 3 characters long")
    
    if len(sanitized) > 200:
        raise DatasetValidationError("Dataset name cannot exceed 200 characters")
    
    return sanitized


def validate_dataset_description(description: str = None) -> str:
    """
    Validate and sanitize dataset description.
    
    Args:
        description: Dataset description to validate
        
    Returns:
        Sanitized description or None
        
    Raises:
        DatasetValidationError: If description is invalid
    """
    if not description:
        return None
    
    if not isinstance(description, str):
        raise DatasetValidationError("Dataset description must be a string")
    
    sanitized = description.strip()
    
    if len(sanitized) > 2000:
        raise DatasetValidationError("Dataset description cannot exceed 2000 characters")
    
    return sanitized if sanitized else None


def create_safe_filename(dataset_name: str, dataset_id: int) -> str:
    """
    Create a safe filename for dataset downloads.
    
    Args:
        dataset_name: Original dataset name
        dataset_id: Dataset ID
        
    Returns:
        Safe filename for downloads
    """
    # Remove unsafe characters and limit length
    safe_name = re.sub(r'[^a-zA-Z0-9\-_\s]', '', dataset_name)
    safe_name = re.sub(r'\s+', '_', safe_name.strip())
    
    # Limit length and add ID for uniqueness
    if len(safe_name) > 50:
        safe_name = safe_name[:50]
    
    return f"{safe_name}_{dataset_id}" if safe_name else f"dataset_{dataset_id}" 