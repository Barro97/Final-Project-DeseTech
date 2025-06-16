from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from passlib.context import CryptContext
import re

from backend.app.database.models import User
from backend.app.features.user.schemas import UserCreate, UserUpdate, UserCreateRequest

# Password hashing context using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hashes a password using the configured password context."""
    return pwd_context.hash(password)

def generate_username_from_email(db: Session, email: str) -> str:
    """
    Generate a unique username from email address.
    
    Args:
        db: Database session
        email: User's email address
        
    Returns:
        Unique username string
    """
    # Extract username part from email and clean it
    email_username = email.split('@')[0]
    # Remove special characters and keep only alphanumeric
    base_username = re.sub(r'[^a-zA-Z0-9]', '', email_username.lower())
    
    # Ensure minimum length
    if len(base_username) < 3:
        base_username = f"user{base_username}"
    
    # Check if username already exists, add number if needed
    username = base_username
    counter = 1
    while db.query(User).filter(User.username == username).first():
        username = f"{base_username}{counter}"
        counter += 1
    
    return username

def create_user_with_auto_username(db: Session, user: UserCreateRequest) -> User:
    """
    Creates a new user with auto-generated username from email.
    
    Args:
        db: The database session.
        user: The user creation schema containing user details (no username required).

    Returns:
        The created User ORM object.

    Raises:
        HTTPException: If the email already exists (400 Bad Request).
    """
    # Generate username from email
    username = generate_username_from_email(db, user.email)
    
    db_user = User(
        email=user.email,
        username=username,
        first_name=user.first_name,
        last_name=user.last_name,
        gender=user.gender,
        password=hash_password(user.password),
        country=user.country,
        education=user.education,
        organization=user.organization,
        role_id=user.role_id
    )
    try:
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except IntegrityError as e:
        db.rollback()
        # Check if it's email duplication (most likely) or username (less likely due to auto-generation)
        if "email" in str(e.orig).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration failed"
            )


def create_user(db: Session, user: UserCreate) -> User:
    """
    Creates a new user in the database with a hashed password.

    Args:
        db: The database session.
        user: The user creation schema containing user details.

    Returns:
        The created User ORM object.

    Raises:
        HTTPException: If the email or username already exists (400 Bad Request).
    """
    db_user = User(
        email=user.email,
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        gender=user.gender,
        password=hash_password(user.password),  # הצפנת הסיסמה
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
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username already registered"
        )


def get_user(db: Session, user_id: int) -> User:
    """
    Retrieves a user by their ID from the database.

    Args:
        db: The database session.
        user_id: The ID of the user to retrieve.

    Returns:
        The User ORM object if found.

    Raises:
        HTTPException: If the user is not found (404 Not Found).
    """
    user = db.query(User).filter(User.user_id == user_id).first()      
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


def update_user(db: Session, user_id: int, user_update: UserUpdate) -> User:
    """
    Updates an existing user's information in the database.

    Only fields present in `user_update` will be modified.

    Args:
        db: The database session.
        user_id: The ID of the user to update.
        user_update: The user update schema containing fields to update.

    Returns:
        The updated User ORM object.

    Raises:
        HTTPException: If the user is not found (via `get_user`).
        HTTPException: If the update fails due to a duplicate email or username (400 Bad Request).
    """
    user = get_user(db, user_id)
    for field, value in user_update.dict(exclude_unset=True).items():
        setattr(user, field, value)

    try:
        db.commit()
        db.refresh(user)
        return user
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Update failed due to duplicate email or username"
        )


def delete_user(db: Session, user_id: int) -> None:
    """
    Deletes a user from the database.

    Args:
        db: The database session.
        user_id: The ID of the user to delete.

    Raises:
        HTTPException: If the user is not found (via `get_user`).
    """
    user = get_user(db, user_id)
    db.delete(user)
    db.commit()






