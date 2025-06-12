"""
User Profile Service - Business Logic Layer

This service implements comprehensive user profile management using a simplified
JSON-based approach, following the established service layer patterns from the
dataset feature. All profile data is stored in the users table with JSON columns
for complex nested data.

ARCHITECTURE OVERVIEW:
- Single table approach with JSON columns for complex data
- Privacy filtering based on viewer relationship to profile owner
- Profile completion calculation for user engagement
- Data transformation between database and frontend formats

KEY DESIGN DECISIONS:
1. **Simplified Schema**: Uses JSON columns in users table instead of multiple tables
2. **Privacy Controls**: Filters data based on privacy level and viewer relationship
3. **Data Transformation**: Converts between database format and frontend ProfileData interface
4. **Profile Completion**: Calculates completion percentage to encourage profile enhancement

USAGE EXAMPLE:
    service = UserProfileService()
    profile = service.get_profile(user_id=123, viewer_user_id=456)
    service.update_profile(user_id=123, profile_data=updated_data)
"""

import logging
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from ..models import User
from ..schemas import ProfileData, ProfileUpdateRequest, ProfileResponse, ContactInfo, ProjectItem, SkillItem

logger = logging.getLogger(__name__)


class UserProfileService:
    """Service class for managing user profiles with simplified JSON approach."""
    
    def get_profile(self, db: Session, user_id: int, viewer_user_id: Optional[int] = None) -> ProfileResponse:
        """
        Retrieve a user's complete profile with privacy filtering.
        
        Transforms database user record into frontend-compatible ProfileData format,
        applying privacy rules based on the relationship between viewer and profile owner.
        
        Args:
            db: Database session
            user_id: ID of the user whose profile to retrieve
            viewer_user_id: ID of the user viewing the profile (None for anonymous)
            
        Returns:
            ProfileResponse with complete profile data, filtered by privacy settings
            
        Raises:
            HTTPException: 404 if user not found, 403 if profile is private and viewer unauthorized
            
        Example:
            >>> service.get_profile(db, user_id=123, viewer_user_id=456)
            ProfileResponse(user_id=123, fullName="John Doe", ...)
        """
        try:
            logger.info(f"Retrieving profile for user {user_id}, viewer: {viewer_user_id}")
            
            # STEP 1: Get user from database
            user = db.query(User).filter(User.user_id == user_id).first()
            if not user:
                logger.warning(f"User {user_id} not found")
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
            
            # STEP 2: Determine viewing permissions
            is_own_profile = viewer_user_id == user_id
            privacy_level = user.privacy_level or "public"
            
            # STEP 3: Apply privacy filtering
            if privacy_level == "private" and not is_own_profile:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Profile is private")
            elif privacy_level == "authenticated" and viewer_user_id is None:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
            
            # STEP 4: Transform database data to frontend format
            profile_data = self._transform_user_to_profile_response(user, is_own_profile)
            
            logger.info(f"Successfully retrieved profile for user {user_id}")
            return profile_data
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error retrieving profile for user {user_id}: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve profile")

    def update_profile(self, db: Session, user_id: int, profile_data: ProfileUpdateRequest, requester_user_id: int) -> ProfileResponse:
        """
        Update user profile with new data.
        
        Updates profile fields and recalculates completion percentage.
        Only the profile owner can update their profile.
        
        Args:
            db: Database session
            user_id: ID of the user whose profile to update
            profile_data: New profile data to save
            requester_user_id: ID of the user making the update request
            
        Returns:
            Updated ProfileResponse
            
        Raises:
            HTTPException: 404 if user not found, 403 if not authorized to update
            
        Example:
            >>> update_data = ProfileUpdateRequest(title="Senior Researcher", bio="New bio")
            >>> service.update_profile(db, user_id=123, profile_data=update_data, requester_user_id=123)
        """
        try:
            logger.info(f"Updating profile for user {user_id}, requester: {requester_user_id}")
            
            # STEP 1: Permission check - only profile owner can update
            if user_id != requester_user_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Can only update your own profile")
            
            # STEP 2: Get user from database
            user = db.query(User).filter(User.user_id == user_id).first()
            if not user:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
            
            # STEP 3: Update profile fields (only update fields that are provided)
            update_data = profile_data.dict(exclude_unset=True)
            
            if 'title' in update_data:
                user.title = update_data['title']
            if 'organization' in update_data:
                user.organization = update_data['organization']
            if 'bio' in update_data:
                user.bio = update_data['bio']
            if 'aboutMe' in update_data:
                user.about_me = update_data['aboutMe']
            if 'coverPhotoUrl' in update_data:
                user.cover_photo_url = update_data['coverPhotoUrl']
            if 'privacy_level' in update_data:
                user.privacy_level = update_data['privacy_level']
            
            # Handle JSON fields
            if 'skills' in update_data:
                # Convert SkillItem objects to dictionaries for JSON storage
                skills_data = []
                for skill in update_data['skills']:
                    if isinstance(skill, dict):
                        skills_data.append(skill)
                    else:
                        skills_data.append(skill.dict())
                user.skills = skills_data
            if 'projects' in update_data:
                # Convert ProjectItem objects to dictionaries for JSON storage
                projects_data = []
                for project in update_data['projects']:
                    if isinstance(project, dict):
                        projects_data.append(project)
                    else:
                        projects_data.append(project.dict())
                user.projects = projects_data
            if 'contact' in update_data:
                # Convert ContactInfo object to dictionary for JSON storage
                contact_data = update_data['contact']
                if hasattr(contact_data, 'dict'):
                    user.contact_info = contact_data.dict()
                else:
                    user.contact_info = contact_data
            
            # STEP 4: Recalculate profile completion percentage
            user.profile_completion_percentage = self._calculate_profile_completion(user)
            
            # STEP 5: Save changes
            db.commit()
            db.refresh(user)
            
            # STEP 6: Return updated profile
            updated_profile = self._transform_user_to_profile_response(user, is_own_profile=True)
            
            logger.info(f"Successfully updated profile for user {user_id}")
            return updated_profile
            
        except HTTPException:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            logger.error(f"Error updating profile for user {user_id}: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update profile")

    def _transform_user_to_profile_response(self, user: User, is_own_profile: bool) -> ProfileResponse:
        """
        Transform database User object to ProfileResponse format.
        
        Converts database schema to frontend-expected format, handling JSON fields
        and applying appropriate defaults for missing data.
        
        Args:
            user: SQLAlchemy User object from database
            is_own_profile: Whether this is the user's own profile
            
        Returns:
            ProfileResponse object ready for API response
        """
        # STEP 1: Build full name from first_name and last_name
        full_name = f"{user.first_name or ''} {user.last_name or ''}".strip()
        if not full_name:
            full_name = user.username
        
        # STEP 2: Handle JSON fields with defaults
        skills_data = user.skills or []
        projects_data = user.projects or []
        contact_data = user.contact_info or {}
        
        # STEP 2.5: Transform skills data to SkillItem format
        skills = []
        for skill in skills_data:
            if isinstance(skill, dict):
                skills.append(SkillItem(
                    name=skill.get('name', ''),
                    category=skill.get('category', 'Other')
                ))
            else:
                # Handle legacy string format (for backward compatibility)
                skills.append(SkillItem(name=str(skill), category='Other'))
        
        # STEP 3: Transform projects data to ProjectItem format
        projects = []
        for i, project in enumerate(projects_data):
            if isinstance(project, dict):
                projects.append(ProjectItem(
                    id=project.get('id', i + 1),
                    name=project.get('name', ''),
                    description=project.get('description', ''),
                    link=project.get('link', '')
                ))
        
        # STEP 4: Build contact info with defaults
        contact = ContactInfo(
            email=contact_data.get('email', user.email),
            linkedin=contact_data.get('linkedin', ''),
            twitter=contact_data.get('twitter', ''),
            orcid=contact_data.get('orcid', '')
        )
        
        # STEP 5: Create ProfileResponse
        return ProfileResponse(
            user_id=user.user_id,
            username=user.username,
            fullName=full_name,
            title=user.title or '',
            organization=user.organization or '',
            bio=user.bio or '',
            aboutMe=user.about_me or '',
            skills=skills,
            projects=projects,
            contact=contact,
            profilePictureUrl=user.profile_picture,
            coverPhotoUrl=user.cover_photo_url,
            privacy_level=user.privacy_level or 'public',
            profile_completion_percentage=user.profile_completion_percentage or 0,
            is_own_profile=is_own_profile
        )

    def _calculate_profile_completion(self, user: User) -> int:
        """
        Calculate profile completion percentage based on filled fields.
        
        Encourages users to complete their profiles by tracking completion.
        Each major section contributes to the overall completion score.
        
        Args:
            user: SQLAlchemy User object
            
        Returns:
            Completion percentage (0-100)
        """
        total_fields = 10
        completed_fields = 0
        
        # Basic info fields (4 points)
        if user.first_name and user.last_name:
            completed_fields += 1
        if user.title:
            completed_fields += 1
        if user.bio:
            completed_fields += 1
        if user.about_me:
            completed_fields += 1
        
        # Profile photos (2 points)
        if user.profile_picture:
            completed_fields += 1
        if user.cover_photo_url:
            completed_fields += 1
        
        # Skills (1 point)
        if user.skills and len(user.skills) > 0:
            completed_fields += 1
        
        # Projects (1 point)
        if user.projects and len(user.projects) > 0:
            completed_fields += 1
        
        # Contact info (1 point)
        if user.contact_info and any(user.contact_info.values()):
            completed_fields += 1
        
        # Education/organization (1 point)
        if user.education or user.organization:
            completed_fields += 1
        
        return int((completed_fields / total_fields) * 100) 