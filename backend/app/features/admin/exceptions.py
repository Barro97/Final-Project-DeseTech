from fastapi import HTTPException


class AdminError(Exception):
    """Base exception for admin-related errors."""
    pass


class AdminPermissionError(AdminError):
    """Raised when user lacks admin permissions."""
    def __init__(self, message: str = "Admin permissions required"):
        super().__init__(message)


class UserNotFoundError(AdminError):
    """Raised when a user is not found."""
    def __init__(self, user_id: int):
        self.user_id = user_id
        super().__init__(f"User with ID {user_id} not found")


class RoleNotFoundError(AdminError):
    """Raised when a role is not found."""
    def __init__(self, role_name: str):
        self.role_name = role_name
        super().__init__(f"Role '{role_name}' not found")


class AdminValidationError(AdminError):
    """Raised when admin action validation fails."""
    def __init__(self, message: str):
        super().__init__(message)


class AdminActionError(AdminError):
    """Raised when admin action fails."""
    def __init__(self, message: str):
        super().__init__(message)


class DatasetAlreadyProcessedError(AdminError):
    """Raised when trying to approve/reject an already processed dataset."""
    def __init__(self, dataset_id: int, current_status: str):
        self.dataset_id = dataset_id
        self.current_status = current_status
        super().__init__(f"Dataset {dataset_id} is already {current_status}")


def handle_admin_exception(error: AdminError) -> HTTPException:
    """Convert admin exceptions to HTTP exceptions."""
    if isinstance(error, AdminPermissionError):
        return HTTPException(status_code=403, detail=str(error))
    elif isinstance(error, UserNotFoundError):
        return HTTPException(status_code=404, detail=str(error))
    elif isinstance(error, RoleNotFoundError):
        return HTTPException(status_code=404, detail=str(error))
    elif isinstance(error, AdminValidationError):
        return HTTPException(status_code=422, detail=str(error))
    elif isinstance(error, AdminActionError):
        return HTTPException(status_code=400, detail=str(error))
    elif isinstance(error, DatasetAlreadyProcessedError):
        return HTTPException(status_code=409, detail=str(error))
    else:
        return HTTPException(status_code=500, detail="Internal server error") 