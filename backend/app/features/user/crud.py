from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from passlib.context import CryptContext

from backend.app.database.models import User
from backend.app.features.user.schemas import UserCreate, UserUpdate

# Password hashing context using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hashes a password using the configured password context."""
    return pwd_context.hash(password)


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






