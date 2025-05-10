from typing import Optional
from pydantic import BaseModel

class UserBase(BaseModel):
    """Base schema for user attributes, shared by other user-related schemas."""
    email: str
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    gender: Optional[str] = None
    country: Optional[str] = None
    profile_picture: Optional[str] = None
    education: Optional[str] = None
    organization: Optional[str] = None
    role_id: Optional[int] = 1

class UserLogin(BaseModel):
    """Schema for user login, requiring email and password."""
    email: str
    password: str

class UserDelete(BaseModel):
    """Schema for user deletion, requiring email for identification (currently not used in API)."""
    # Note: This schema is defined but not currently used by any API endpoint for deletion,
    # as deletion is typically done via user_id path parameter.
    email: str

class UserCreate(UserBase):
    """Schema for creating a new user, inherits from UserBase and adds password."""
    password: str

class UserUpdate(UserBase):
    """Schema for updating an existing user. All fields are optional by inheritance from UserBase."""
    # By inheriting UserBase, all fields are optional for an update operation.
    # Pydantic models used for updates often have all fields optional.
    pass

class User(UserBase):
    """Schema for representing a user, including their ID. Used for API responses."""
    user_id: int

    class Config:
        """Pydantic configuration to allow ORM mode for mapping from SQLAlchemy models."""
        orm_mode = True
