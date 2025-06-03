from fastapi import HTTPException


class DatasetError(Exception):
    """Base exception for dataset-related errors."""
    pass


class DatasetNotFoundError(DatasetError):
    """Raised when a dataset is not found."""
    def __init__(self, dataset_id: int):
        self.dataset_id = dataset_id
        super().__init__(f"Dataset with ID {dataset_id} not found")


class DatasetPermissionError(DatasetError):
    """Raised when user lacks permission for dataset operation."""
    def __init__(self, message: str = "Insufficient permissions for dataset operation"):
        super().__init__(message)


class DatasetOwnershipError(DatasetError):
    """Raised when there are issues with dataset ownership operations."""
    def __init__(self, message: str):
        super().__init__(message)


class DatasetValidationError(DatasetError):
    """Raised when dataset data validation fails."""
    def __init__(self, message: str):
        super().__init__(message)


def handle_dataset_exception(error: DatasetError) -> HTTPException:
    """Convert dataset exceptions to HTTP exceptions."""
    if isinstance(error, DatasetNotFoundError):
        return HTTPException(status_code=404, detail=str(error))
    elif isinstance(error, DatasetPermissionError):
        return HTTPException(status_code=403, detail=str(error))
    elif isinstance(error, DatasetOwnershipError):
        return HTTPException(status_code=400, detail=str(error))
    elif isinstance(error, DatasetValidationError):
        return HTTPException(status_code=422, detail=str(error))
    else:
        return HTTPException(status_code=500, detail="Internal server error") 