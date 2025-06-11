"""
Request schemas for user profile operations.

This module contains Pydantic models used for validating incoming API requests
related to user profile management. These schemas define the structure and
validation rules for data coming from the frontend.
"""

from typing import Optional, List
from pydantic import BaseModel, validator, HttpUrl
from enum import Enum


class PrivacyLevel(str, Enum):
    """Enumeration of available privacy levels for user profiles."""
    PUBLIC = "public"
    AUTHENTICATED = "authenticated"
    PRIVATE = "private"


class SkillCategory(str, Enum):
    """Enumeration of skill categories for better organization."""
    CORE_SKILLS = "Core Skills"
    FRAMEWORKS_TOOLS = "Frameworks & Tools"
    SPECIALIZATIONS = "Specializations"
    OTHER = "Other"


class ProfileUpdateRequest(BaseModel):
    """Schema for updating user profile basic information."""
    bio: Optional[str] = None
    about_me: Optional[str] = None
    title: Optional[str] = None
    cover_photo_url: Optional[str] = None
    privacy_level: Optional[PrivacyLevel] = None

    @validator('bio')
    def validate_bio(cls, v):
        if v is not None and len(v) > 500:
            raise ValueError('Bio must be 500 characters or less')
        return v

    @validator('about_me')
    def validate_about_me(cls, v):
        if v is not None and len(v) > 2000:
            raise ValueError('About me must be 2000 characters or less')
        return v

    @validator('title')
    def validate_title(cls, v):
        if v is not None and len(v) > 255:
            raise ValueError('Title must be 255 characters or less')
        return v


class SkillRequest(BaseModel):
    """Schema for individual skill creation/update."""
    skill_name: str
    category: Optional[SkillCategory] = SkillCategory.OTHER
    is_visible: bool = True
    display_order: Optional[int] = None

    @validator('skill_name')
    def validate_skill_name(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Skill name cannot be empty')
        if len(v) > 255:
            raise ValueError('Skill name must be 255 characters or less')
        return v.strip()


class ProjectRequest(BaseModel):
    """Schema for individual project/publication creation/update."""
    name: str
    description: Optional[str] = None
    link: Optional[str] = None
    is_visible: bool = True
    display_order: Optional[int] = None

    @validator('name')
    def validate_name(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Project name cannot be empty')
        if len(v) > 255:
            raise ValueError('Project name must be 255 characters or less')
        return v.strip()

    @validator('description')
    def validate_description(cls, v):
        if v is not None and len(v) > 1000:
            raise ValueError('Project description must be 1000 characters or less')
        return v

    @validator('link')
    def validate_link(cls, v):
        if v is not None and v.strip():
            # Basic URL validation - accept URLs with or without protocol
            if not v.startswith(('http://', 'https://', 'www.')):
                v = 'https://' + v
        return v


class ContactRequest(BaseModel):
    """Schema for updating contact information."""
    linkedin: Optional[str] = None
    twitter: Optional[str] = None
    orcid: Optional[str] = None
    personal_email: Optional[str] = None
    show_email: bool = False
    show_linkedin: bool = True
    show_twitter: bool = True
    show_orcid: bool = True

    @validator('linkedin')
    def validate_linkedin(cls, v):
        if v is not None and v.strip():
            # Normalize LinkedIn URL
            v = v.strip()
            if not v.startswith(('http://', 'https://')):
                if v.startswith('linkedin.com'):
                    v = 'https://' + v
                elif not v.startswith('www.'):
                    v = 'https://linkedin.com/in/' + v.replace('@', '')
        return v

    @validator('twitter')
    def validate_twitter(cls, v):
        if v is not None and v.strip():
            # Normalize Twitter handle
            v = v.strip()
            if not v.startswith('@'):
                v = '@' + v
        return v

    @validator('orcid')
    def validate_orcid(cls, v):
        if v is not None and v.strip():
            # Basic ORCID format validation
            v = v.strip().replace('https://orcid.org/', '')
            if not v.replace('-', '').isdigit() or len(v.replace('-', '')) != 16:
                raise ValueError('ORCID must be in format 0000-0000-0000-0000')
        return v


class FullProfileUpdateRequest(BaseModel):
    """Schema for updating the complete user profile in one request."""
    profile: Optional[ProfileUpdateRequest] = None
    skills: Optional[List[SkillRequest]] = None
    projects: Optional[List[ProjectRequest]] = None
    contact: Optional[ContactRequest] = None

    @validator('skills')
    def validate_skills(cls, v):
        if v is not None and len(v) > 50:
            raise ValueError('Maximum 50 skills allowed')
        return v

    @validator('projects')
    def validate_projects(cls, v):
        if v is not None and len(v) > 20:
            raise ValueError('Maximum 20 projects allowed')
        return v


class PrivacySettingsRequest(BaseModel):
    """Schema for updating profile privacy settings."""
    privacy_level: PrivacyLevel
    show_email: Optional[bool] = None
    show_linkedin: Optional[bool] = None
    show_twitter: Optional[bool] = None
    show_orcid: Optional[bool] = None 