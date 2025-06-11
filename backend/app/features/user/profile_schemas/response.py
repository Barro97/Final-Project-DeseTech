"""
Response schemas for user profile operations.

This module contains Pydantic models used for formatting API responses
related to user profile management. These schemas define the structure
of data sent to the frontend.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime
from .request import PrivacyLevel, SkillCategory


class SkillResponse(BaseModel):
    """Schema for individual skill in API responses."""
    skill_id: int
    skill_name: str
    category: Optional[str] = None
    is_visible: bool
    display_order: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ProjectResponse(BaseModel):
    """Schema for individual project/publication in API responses."""
    project_id: int
    name: str
    description: Optional[str] = None
    link: Optional[str] = None
    is_visible: bool
    display_order: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ContactResponse(BaseModel):
    """Schema for contact information in API responses."""
    linkedin: Optional[str] = None
    twitter: Optional[str] = None
    orcid: Optional[str] = None
    personal_email: Optional[str] = None
    show_email: bool
    show_linkedin: bool
    show_twitter: bool
    show_orcid: bool
    updated_at: datetime

    class Config:
        from_attributes = True


class ProfileInfoResponse(BaseModel):
    """Schema for basic profile information in API responses."""
    bio: Optional[str] = None
    about_me: Optional[str] = None
    title: Optional[str] = None
    cover_photo_url: Optional[str] = None
    profile_completion_percentage: int
    privacy_level: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CategorizedSkills(BaseModel):
    """Schema for skills organized by category."""
    core_skills: List[SkillResponse] = []
    frameworks_tools: List[SkillResponse] = []
    specializations: List[SkillResponse] = []
    other: List[SkillResponse] = []


class PrivacyInfo(BaseModel):
    """Schema for privacy-related information in profile responses."""
    is_own_profile: bool
    visible_sections: List[str]
    profile_completion: int
    can_contact: bool = True


class BasicUserInfo(BaseModel):
    """Schema for basic user information included in profile responses."""
    user_id: int
    username: str
    email: Optional[str] = None  # Only shown to profile owner or if privacy allows
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    profile_picture: Optional[str] = None
    country: Optional[str] = None
    education: Optional[str] = None
    organization: Optional[str] = None
    
    class Config:
        from_attributes = True


class FullProfileResponse(BaseModel):
    """Complete profile response schema with all profile information."""
    user_info: BasicUserInfo
    profile: Optional[ProfileInfoResponse] = None
    skills: Optional[CategorizedSkills] = None
    projects: Optional[List[ProjectResponse]] = None
    contact: Optional[ContactResponse] = None
    privacy_info: PrivacyInfo
    
    class Config:
        from_attributes = True


class PublicProfileResponse(BaseModel):
    """Limited profile response for public viewing."""
    user_info: BasicUserInfo
    profile: Optional[ProfileInfoResponse] = None
    public_skills: Optional[List[SkillResponse]] = None
    public_projects: Optional[List[ProjectResponse]] = None
    public_contact: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True


class ProfileStatsResponse(BaseModel):
    """Schema for profile statistics and metrics."""
    total_skills: int
    total_projects: int
    profile_completion_percentage: int
    last_updated: Optional[datetime] = None
    visibility_level: str
    
    class Config:
        from_attributes = True


class PrivacySettingsResponse(BaseModel):
    """Schema for privacy settings response."""
    privacy_level: PrivacyLevel
    contact_privacy: ContactResponse
    sections_visible: List[str]
    
    class Config:
        from_attributes = True 