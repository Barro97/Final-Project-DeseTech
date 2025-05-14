from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.features.authorizations import permit_action
from backend.database.session import get_db
from backend.schemas.user import UserCreate, UserUpdate, User as UserSchema
from backend.crud.user import (
    create_user,
    get_user,
    update_user,
    delete_user,
)

router = APIRouter(
    prefix="/users",
    #tags=["users"]
)

@router.post("/create_new_user", status_code=status.HTTP_201_CREATED)
def create_new_user(user: UserCreate, db: Session = Depends(get_db)):
    return create_user(db=db, user=user)  

@router.get("/get_user_by_id/{user_id}") #,response_model=UserSchema
def read_user(user_id: int, db: Session = Depends(get_db)):
    return get_user(db=db, user_id=user_id)

@router.put("/users/{user_id}")
def update_user(
    user_id: int,
    user_data: UserUpdateSchema,
    db: Session = Depends(get_db),
    user = Depends(permit_action("user"))
):
    # Now you have ensured that the user has the permission to update this user
    # If the user is the owner or an admin, we can proceed to update
    return update_user(db=db, user_id=user_id, user_update=user_data)

@router.delete("/delete_user/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_user(user_id: int, db: Session = Depends(get_db), user = Depends(permit_action("user"))  # Check if the user is the owner or an admin
):
    delete_user(db=db, user_id=user_id)
    return None
