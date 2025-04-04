from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from typing import Optional

from backend.database.models import User
from backend.schemas.user import UserCreate, UserUpdate

def create_user(db: Session, user: UserCreate) -> User:
    """Create a new user in the database"""
    db_user = User(
        email=user.email,
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        gender=user.gender,
        password=user.password,  # Note: In production, this should be hashed
        country=user.country,
        profile_picture=user.profile_picture,
        education=user.education,
        organization=user.organization,
        role_id=user.role_id
    )
    try:
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username already registered"
        )

def get_user(db: Session, user_id: int) -> User:
    """Get a user by ID"""
    user = db.query(User).filter(User.user_id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )
    return user

def get_user_by_email(db: Session, email: str) -> User:
    """Get a user by email"""
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with email {email} not found"
        )
    return user

def get_users(db: Session, skip: int = 0, limit: int = 100):
    """Get a list of users with pagination"""
    return db.query(User).offset(skip).limit(limit).all()

def update_user(db: Session, user_id: int, user_update: UserUpdate) -> User:
    """Update a user's information"""
    db_user = get_user(db, user_id)
    
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_user, field, value)

    try:
        db.commit()
        db.refresh(db_user)
        return db_user
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username already exists"
        )

def delete_user(db: Session, user_id: int) -> bool:
    """Delete a user"""
    db_user = get_user(db, user_id)
    db.delete(db_user)
    db.commit()
    return True
    database