from fastapi import APIRouter, Depends,  status
from sqlalchemy.orm import Session
from typing import List

from backend.app.database.session import get_db
from backend.app.features.authentication.utils.authorizations import permit_action
from backend.app.features.user.schemas import UserCreate, UserUpdate, User as UserSchema
from backend.app.features.user.crud import (
    create_user,
    get_user,
    update_user,
    delete_user,
)

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

@router.post("/", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
def create_user_endpoint(user: UserCreate, db: Session = Depends(get_db)):
    """
    Create a new user in the system.
    """
    return create_user(db=db, user=user)

@router.get("/{user_id}", response_model=UserSchema)
def read_user_endpoint(user_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a user by their ID.
    """
    return get_user(db=db, user_id=user_id)

@router.put("/{user_id}", response_model=UserSchema)
def update_user_endpoint(user_id: int, user_data: UserUpdate, db: Session = Depends(get_db), user = Depends(permit_action("user"))):
    """
    Update an existing user's information.
    """
    return update_user(db=db, user_id=user_id, user_update=user_data)

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_endpoint(user_id: int, db: Session = Depends(get_db),user = Depends(permit_action("user"))):
    """
    Delete a user from the system.
    Responds with 204 No Content on successful deletion.
    """
    delete_user(db=db, user_id=user_id)
    return None

