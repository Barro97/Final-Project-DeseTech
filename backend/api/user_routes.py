from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database.models import User
from schemas.user import UserCreate, User as UserSchema, UserUpdate
from crud.user import (
    create_user,
    get_user,
    get_users,
    update_user,
    delete_user,
    get_user_by_email
)
from database.database import get_db

router = APIRouter(
 #   prefix="/users",
  #  tags=["users"]
)

@router.post("/", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
def create_new_user(user: UserCreate, db: Session = Depends(get_db)):
    """Create a new user"""
    return create_user(db=db, user=user)

@router.get("/{user_id}", response_model=UserSchema)
def read_user(user_id: int, db: Session = Depends(get_db)):
    """Get a specific user by ID"""
    return get_user(db=db, user_id=user_id)

@router.get("/", response_model=List[UserSchema])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get a list of users"""
    return get_users(db=db, skip=skip, limit=limit)

@router.get("/by-email/{email}", response_model=UserSchema)
def read_user_by_email(email: str, db: Session = Depends(get_db)):
    """Get a specific user by email"""
    return get_user_by_email(db=db, email=email)

@router.put("/{user_id}", response_model=UserSchema)
def update_user_info(user_id: int, user: UserUpdate, db: Session = Depends(get_db)):
    """Update a user's information"""
    return update_user(db=db, user_id=user_id, user_update=user)

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_user(user_id: int, db: Session = Depends(get_db)):
    """Delete a user"""
    delete_user(db=db, user_id=user_id)
    return None