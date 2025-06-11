from typing import Optional, List, Dict, Any
from pydantic import BaseModel, validator
from enum import Enum

class PrivacyLevel(str, Enum):
    """Enumeration of available privacy levels for user profiles."""
    PUBLIC = "public"
    AUTHENTICATED = "authenticated"
    PRIVATE = "private"

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

# Profile-specific schemas
class SkillItem(BaseModel):
    """Schema for individual skill with category."""
    name: str
    category: Optional[str] = "Other"

class ProjectItem(BaseModel):
    """Schema for individual project/publication."""
    id: int
    name: str
    description: str
    link: str

class ContactInfo(BaseModel):
    """Schema for contact information with privacy controls."""
    email: str
    linkedin: str
    twitter: str
    orcid: str

class ProfileData(BaseModel):
    """Complete profile data schema matching frontend interface."""
    fullName: str
    title: str
    bio: str
    aboutMe: str
    skills: List[str]
    projects: List[ProjectItem]
    contact: ContactInfo
    profilePictureUrl: Optional[str] = None
    coverPhotoUrl: Optional[str] = None

class ProfileUpdateRequest(BaseModel):
    """Schema for updating profile information."""
    title: Optional[str] = None
    bio: Optional[str] = None
    aboutMe: Optional[str] = None
    coverPhotoUrl: Optional[str] = None
    skills: Optional[List[str]] = None
    projects: Optional[List[ProjectItem]] = None
    contact: Optional[ContactInfo] = None
    privacy_level: Optional[PrivacyLevel] = None

    @validator('bio')
    def validate_bio(cls, v):
        if v is not None and len(v) > 500:
            raise ValueError('Bio must be 500 characters or less')
        return v

    @validator('aboutMe')
    def validate_about_me(cls, v):
        if v is not None and len(v) > 2000:
            raise ValueError('About me must be 2000 characters or less')
        return v

    @validator('title')
    def validate_title(cls, v):
        if v is not None and len(v) > 255:
            raise ValueError('Title must be 255 characters or less')
        return v

class ProfileResponse(BaseModel):
    """Schema for profile API responses."""
    user_id: int
    username: str
    fullName: str
    title: Optional[str] = None
    bio: Optional[str] = None
    aboutMe: Optional[str] = None
    skills: List[str] = []
    projects: List[ProjectItem] = []
    contact: ContactInfo
    profilePictureUrl: Optional[str] = None
    coverPhotoUrl: Optional[str] = None
    privacy_level: str = "public"
    profile_completion_percentage: int = 0
    is_own_profile: bool = False

    class Config:
        from_attributes = True
