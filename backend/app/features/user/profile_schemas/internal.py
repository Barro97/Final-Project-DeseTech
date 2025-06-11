"""
Internal schemas for user profile operations.

This module contains Pydantic models used for data transfer between
different layers of the backend (service layer, repository layer, etc.).
These schemas are not exposed via the API.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime
from .request import PrivacyLevel


class ProfileCompletionMetrics(BaseModel):
    """Internal schema for tracking profile completion metrics."""
    has_bio: bool = False
    has_about_me: bool = False
    has_title: bool = False
    has_cover_photo: bool = False
    has_skills: bool = False
    has_projects: bool = False
    has_contact_info: bool = False
    total_fields: int = 7
    completed_fields: int = 0
    completion_percentage: int = 0


class VisibilityContext(BaseModel):
    """Internal schema for determining what profile information is visible."""
    viewer_user_id: Optional[int] = None
    profile_owner_id: int
    is_own_profile: bool = False
    is_authenticated: bool = False
    profile_privacy_level: PrivacyLevel = PrivacyLevel.PUBLIC


class ProfileFilter(BaseModel):
    """Internal schema for filtering profile data based on privacy settings."""
    show_profile_info: bool = True
    show_skills: bool = True
    show_projects: bool = True
    show_contact: bool = True
    show_email: bool = False
    show_linkedin: bool = True
    show_twitter: bool = True
    show_orcid: bool = True


class ProfileAggregateData(BaseModel):
    """Internal schema for aggregated profile data from multiple tables."""
    user_id: int
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: str
    profile_picture: Optional[str] = None
    country: Optional[str] = None
    education: Optional[str] = None
    organization: Optional[str] = None
    
    # Profile information
    bio: Optional[str] = None
    about_me: Optional[str] = None
    title: Optional[str] = None
    cover_photo_url: Optional[str] = None
    privacy_level: str = "public"
    profile_completion_percentage: int = 0
    
    # Related data
    skills: List[Dict[str, Any]] = []
    projects: List[Dict[str, Any]] = []
    contact: Optional[Dict[str, Any]] = None


class ProfileUpdateResult(BaseModel):
    """Internal schema for profile update operation results."""
    success: bool
    updated_sections: List[str] = []
    errors: List[str] = []
    new_completion_percentage: int
    profile_id: int 