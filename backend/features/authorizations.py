from fastapi import Depends, HTTPException, status
from backend.dependencies import get_current_user
from sqlalchemy.orm import Session
from backend.database.models import DataSet
from fastapi.security import OAuth2PasswordBearer
from backend.token_creation import verify_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")  


def role_required(allowed_roles: list[str]):
    def checker(user = Depends(get_current_user)):
        if user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return user
    return checker


def verify_dataset_ownership(db: Session, dataset_id: int, current_user_id: int):
    dataset = db.query(DataSet).filter(DataSet.id == dataset_id).first()

    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    if dataset.uploader_id != current_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this dataset")

    return True

def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = verify_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    return payload




