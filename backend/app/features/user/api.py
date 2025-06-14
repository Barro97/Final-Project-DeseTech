from fastapi import APIRouter, Depends, status, HTTPException, Request, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.app.database.session import get_db
from backend.app.features.authentication.utils.authorizations import permit_action, get_current_user, oauth2_scheme
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
from backend.app.features.user.search_service import UserSearchService
from backend.app.features.user.user_schemas.search import (
    UserSearchRequest, UserSearchListResponse
)
from backend.app.features.file.utils.upload import save_file
from backend.app.database.models import User

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

async def get_optional_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> Optional[dict]:
    """
    Get current user from Authorization header, but return None if no token or invalid token.
    This allows for optional authentication on endpoints.
    """
    from fastapi.security.utils import get_authorization_scheme_param
    
    # Get token from Authorization header
    authorization: str = request.headers.get("Authorization")
    if not authorization:
        return None
    
    scheme, token = get_authorization_scheme_param(authorization)
    if scheme.lower() != "bearer" or not token:
        return None
    
    try:
        # Use existing get_current_user logic
        from backend.app.features.authentication.utils.token_creation import verify_token
        from backend.app.database.models import User
        
        payload = verify_token(token)
        
        # Check if token verification failed
        if isinstance(payload, dict) and payload.get("error_message"):
            return None
        
        user_id = payload.get("sub")
        if user_id is None:
            return None
            
        # Convert user_id to int since it's stored as string in JWT
        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            return None
        
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            return None
            
        # Return a dictionary instead of the user object
        return {
            "user_id": user.user_id,
            "email": user.email,
            "role": user.role.role_name if user.role else None
        }
    except Exception:
        # If token is invalid, return None instead of raising error
        return None

@router.post("/", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
def create_user_endpoint(user: UserCreate, db: Session = Depends(get_db)):
    """
    Create a new user in the system.
    """
    return create_user(db=db, user=user)

# User Search Endpoints - MUST BE BEFORE /{user_id} route to avoid conflicts
@router.get("/search", response_model=UserSearchListResponse)
async def search_users(
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_optional_current_user),
    search_term: Optional[str] = Query(None, max_length=100),
    roles: Optional[List[str]] = Query(None),
    organizations: Optional[List[str]] = Query(None),
    skills: Optional[List[str]] = Query(None),
    status: Optional[List[str]] = Query(None),
    has_datasets: Optional[bool] = Query(None),
    min_datasets: Optional[int] = Query(None, ge=0),
    profile_completeness: Optional[str] = Query(None),
    sort_by: str = Query("relevance", regex="^(relevance|name|recent|datasets|activity)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """
    Search users with privacy-aware filtering and intelligent ranking.
    
    This endpoint allows searching for users across the platform with respect
    for privacy settings. Results are filtered based on the viewer's authentication
    status and the target users' privacy preferences.
    
    Privacy Rules:
    - Anonymous users: Only see public profiles
    - Authenticated users: See public + authenticated profiles + own private profile
    - All users: Cannot see inactive/suspended users
    
    Search Features:
    - Multi-field search: names, usernames, organizations, bios
    - Advanced filtering: roles, organizations, dataset counts, profile completeness
    - Intelligent sorting: relevance, name, activity, dataset count
    - Pagination support for large result sets
    
    Authentication is optional - anonymous users can search public profiles.
    """
    try:
        # Create search request from query parameters
        search_request = UserSearchRequest(
            search_term=search_term,
            roles=roles,
            organizations=organizations,
            skills=skills,
            status=status,
            has_datasets=has_datasets,
            min_datasets=min_datasets,
            profile_completeness=profile_completeness,
            sort_by=sort_by,
            page=page,
            limit=limit
        )
        
        # Get viewer user ID for privacy filtering
        viewer_user_id = current_user["user_id"] if current_user else None
        
        # Execute search
        search_service = UserSearchService()
        return search_service.search_users(db, search_request, viewer_user_id)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error searching users: {str(e)}"
        )


@router.get("/search-suggestions", response_model=List[str])
async def get_user_search_suggestions(
    search_term: str = Query(..., min_length=2, max_length=100),
    limit: int = Query(8, ge=1, le=20),
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    """
    Get search suggestions for user search autocomplete.
    
    This endpoint provides intelligent autocomplete suggestions based on:
    - User names (first priority)
    - Organizations (second priority)
    - Respects privacy settings (only suggests discoverable users)
    
    Suggestions are ranked by user activity and relevance to provide
    the most useful autocomplete experience.
    
    Args:
        search_term: Partial search term (minimum 2 characters)
        limit: Maximum suggestions to return (1-20, default 8)
        
    Returns:
        List[str]: Suggested search terms based on actual user data
        
    Authentication is optional - anonymous users get suggestions from public profiles only.
    """
    try:
        viewer_user_id = current_user["user_id"] if current_user else None
        
        search_service = UserSearchService()
        return search_service.get_search_suggestions(db, search_term, limit, viewer_user_id)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting user search suggestions: {str(e)}"
        )

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
async def get_user_profile(
    user_id: int, 
    db: Session = Depends(get_db), 
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    """
    Retrieve a user's complete profile with privacy filtering.
    
    Returns profile data based on privacy settings and viewer relationship.
    Public profiles are viewable by anyone, authenticated profiles require login,
    private profiles are only viewable by the owner.
    
    Authentication is optional - if no token is provided, only public profiles are accessible.
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
    
    Authentication is required for profile updates.
    """
    service = UserProfileService()
    return service.update_profile(db, user_id, profile_data, current_user["user_id"])

@router.post("/{user_id}/profile/picture")
async def upload_profile_picture(
    user_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload a profile picture for a user.
    
    Only the profile owner can update their profile picture.
    Accepts image files (jpg, jpeg, png, gif, webp) up to a reasonable size.
    Returns the URL of the uploaded image.
    """
    # Permission check - only profile owner can upload
    if user_id != current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Can only update your own profile picture"
        )
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image (jpg, jpeg, png, gif, webp)"
        )
    
    # Validate file size (5MB limit)
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Seek back to start
    
    if file_size > 5 * 1024 * 1024:  # 5MB
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size must be less than 5MB"
        )
    
    # Get user from database
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="User not found"
        )
    
    try:
        # Upload file using existing infrastructure
        file_path, size = save_file(file)
        
        # Get public URL for the uploaded file
        from backend.app.features.file.utils.upload import client, SUPABASE_STORAGE_BUCKET
        
        # Try using signed URL for better compatibility
        try:
            # Create a long-term signed URL (1 year)
            signed_url_result = client.storage.from_(SUPABASE_STORAGE_BUCKET).create_signed_url(file_path, 60*60*24*365)
            
            if isinstance(signed_url_result, dict) and 'signedURL' in signed_url_result:
                file_url = signed_url_result['signedURL']
            else:
                # Fallback to public URL approach
                public_url_response = client.storage.from_(SUPABASE_STORAGE_BUCKET).get_public_url(file_path)
                if isinstance(public_url_response, dict):
                    file_url = public_url_response.get('publicUrl') or public_url_response.get('publicURL') or public_url_response.get('url')
                elif hasattr(public_url_response, 'url'):
                    file_url = public_url_response.url
                elif hasattr(public_url_response, 'publicUrl'):
                    file_url = public_url_response.publicUrl
                else:
                    file_url = str(public_url_response)
                    
                # Clean up the URL - remove trailing query parameters if empty
                if file_url and file_url.endswith('?'):
                    file_url = file_url.rstrip('?')
                
        except Exception:
            # Fallback to public URL approach
            public_url_response = client.storage.from_(SUPABASE_STORAGE_BUCKET).get_public_url(file_path)
            if isinstance(public_url_response, dict):
                file_url = public_url_response.get('publicUrl') or public_url_response.get('publicURL') or public_url_response.get('url')
            elif hasattr(public_url_response, 'url'):
                file_url = public_url_response.url
            elif hasattr(public_url_response, 'publicUrl'):
                file_url = public_url_response.publicUrl
            else:
                file_url = str(public_url_response)
                
            # Clean up the URL - remove trailing query parameters if empty
            if file_url and file_url.endswith('?'):
                file_url = file_url.rstrip('?')
        
        # Final validation and manual construction if needed
        if not file_url or not file_url.startswith('http'):
            # Fallback: construct URL manually
            from backend.app.core.config import SUPABASE_URL
            file_url = f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_STORAGE_BUCKET}/{file_path}"
        
        # Update user's profile picture URL
        user.profile_picture = file_url
        db.commit()
        
        return {
            "message": "Profile picture uploaded successfully",
            "profile_picture_url": file_url,
            "file_size": size
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload profile picture: {str(e)}"
        )




