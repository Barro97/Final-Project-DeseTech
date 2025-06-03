from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database.models import Dataset, User
from fastapi.security import OAuth2PasswordBearer
from backend.app.features.authentication.utils.token_creation import verify_token
from backend.app.database.session import get_db 

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")  # Fixed tokenUrl to match the actual endpoint


def verify_dataset_ownership(db: Session, dataset_id: int, current_user_id: int):
    dataset = db.query(Dataset).filter(Dataset.dataset_id == dataset_id).first()

    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    if dataset.uploader_id != current_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this dataset")

    return True

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    payload = verify_token(token)

    # Check if token verification failed
    if isinstance(payload, dict) and payload.get("error_message"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    user_id = payload.get("sub")  # sub is a standard JWT claim for subject (user ID)

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing user ID",
        )

    # Convert user_id to int since it's stored as string in JWT
    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token",
        )

    user = db.query(User).filter(User.user_id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    # Return a dictionary instead of the user object
    return {
        "user_id": user.user_id,
        "email": user.email,
        "role": user.role.role_name if user.role else None
    }

def permit_action(resource_type: str):
    def checker(
        dataset_id: int = None,
        user_id: int = None,
        db: Session = Depends(get_db),
        current_user: dict = Depends(get_current_user)
    ):
        # Admins can always proceed (case-insensitive check)
        if current_user["role"] and current_user["role"].lower() == "admin":
            return current_user

        # Ownership check
        if resource_type == "dataset":
            dataset = db.query(Dataset).filter(Dataset.dataset_id == dataset_id).first()
            if not dataset:
                raise HTTPException(status_code=404, detail="Dataset not found")
            if dataset.uploader_id != current_user["user_id"]:
                raise HTTPException(status_code=403, detail="You do not own this dataset")

        elif resource_type == "user":
            if user_id != current_user["user_id"]:
                raise HTTPException(status_code=403, detail="You can only access your own user")

        else:
            raise HTTPException(status_code=400, detail="Invalid resource type")

        return current_user

    return checker




