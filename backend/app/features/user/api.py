from fastapi import APIRouter, Depends,  status
from sqlalchemy.orm import Session
from typing import List

from backend.app.database.session import get_db
from backend.app.features.authentication.utils.authorizations import permit_action, get_current_user
from backend.app.features.user.schemas import (
    UserCreate, UserUpdate, User as UserSchema, 
    ProfileUpdateRequest, ProfileResponse
)
from backend.app.features.user.crud import (
    create_user,
    get_user,
    update_user,
    delete_user,
)
from backend.app.features.user.services.profile_service import UserProfileService

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

@router.post("/", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
def create_user_endpoint(user: UserCreate, db: Session = Depends(get_db)):
    """
    Create a new user in the system.
    """
    return create_user(db=db, user=user)

@router.get("/{user_id}", response_model=UserSchema)
def read_user_endpoint(user_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a user by their ID.
    """
    return get_user(db=db, user_id=user_id)

@router.put("/{user_id}", response_model=UserSchema)
def update_user_endpoint(user_id: int, user_data: UserUpdate, db: Session = Depends(get_db), user = Depends(permit_action("user"))):
    """
    Update an existing user's information.
    """
    return update_user(db=db, user_id=user_id, user_update=user_data)

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_endpoint(user_id: int, db: Session = Depends(get_db),user = Depends(permit_action("user"))):
    """
    Delete a user from the system.
    Responds with 204 No Content on successful deletion.
    """
    delete_user(db=db, user_id=user_id)
    return None


# Profile-specific endpoints
@router.get("/{user_id}/profile", response_model=ProfileResponse)
def get_user_profile(
    user_id: int, 
    db: Session = Depends(get_db), 
    current_user: dict = Depends(get_current_user)
):
    """
    Retrieve a user's complete profile with privacy filtering.
    
    Returns profile data based on privacy settings and viewer relationship.
    Public profiles are viewable by anyone, authenticated profiles require login,
    private profiles are only viewable by the owner.
    """
    service = UserProfileService()
    viewer_user_id = current_user["user_id"] if current_user else None
    return service.get_profile(db, user_id, viewer_user_id)

@router.get("/{user_id}/profile/public", response_model=ProfileResponse)
def get_user_profile_public(user_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a user's public profile without authentication.
    
    Only returns data for public profiles. Useful for anonymous browsing
    of researcher profiles.
    """
    service = UserProfileService()
    return service.get_profile(db, user_id, viewer_user_id=None)

@router.put("/{user_id}/profile", response_model=ProfileResponse)
def update_user_profile(
    user_id: int,
    profile_data: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Update a user's profile information.
    
    Only the profile owner can update their profile. Updates can be partial -
    only provided fields will be updated. Profile completion percentage is
    automatically recalculated.
    """
    service = UserProfileService()
    return service.update_profile(db, user_id, profile_data, current_user["user_id"])

