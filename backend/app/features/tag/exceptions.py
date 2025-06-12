class TagError(Exception):
    """Base exception for tag-related errors."""
    pass

class TagValidationError(TagError):
    """Raised when tag validation fails."""
    pass

class TagPermissionError(TagError):
    """Raised when user lacks permission for tag operations."""
    pass

def handle_tag_exception(e: TagError):
    """Handle tag-related exceptions and convert to appropriate HTTP responses."""
    from fastapi import HTTPException
    
    if isinstance(e, TagValidationError):
        raise HTTPException(status_code=400, detail=str(e))
    elif isinstance(e, TagPermissionError):
        raise HTTPException(status_code=403, detail=str(e))
    else:
        raise HTTPException(status_code=500, detail="Internal server error") 