from fastapi import Depends, APIRouter, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from passlib.context import CryptContext
from backend.app.features.user.schemas import UserLogin
from backend.app.database.models import User, Role
from backend.app.features.authentication.utils.token_creation import create_access_token
from backend.app.features.authentication.utils.authorizations import get_current_user
from jose import JWTError, jwt
from backend.app.features.authentication.utils.token_creation import SECRET_KEY, ALGORITHM
from pydantic import BaseModel
from typing import Optional
import secrets
import string

router = APIRouter(prefix='/auth')

# Set up password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth user schema
class OAuthUserData(BaseModel):
    email: str
    name: str
    provider: str
    provider_id: str
    picture: Optional[str] = None

# Login Route + token creation
@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    # Check if user exists in the database
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    # Verify the password
    if not pwd_context.verify(user.password, db_user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    # If valid credentials, generate the JWT token
    # Safely access role name
    user_role = db_user.role.role_name if db_user.role else None
    access_token = create_access_token(data={
        "email": db_user.email,
        "role": user_role,
        "user_id": db_user.user_id  # Use user_id consistently
    })
    
    # Return the token in response
    return {"access_token": access_token, "token_type": "bearer"}

# OAuth login/registration endpoint
@router.post("/oauth")
def oauth_login(oauth_data: OAuthUserData, db: Session = Depends(get_db)):
    """
    Handle OAuth login/registration. Creates user if doesn't exist, returns JWT token.
    """
    try:
        # Check if user exists by OAuth provider and ID
        db_user = db.query(User).filter(
            User.oauth_provider == oauth_data.provider,
            User.oauth_id == oauth_data.provider_id
        ).first()
        
        if not db_user:
            # Check if user exists by email (for linking existing accounts)
            db_user = db.query(User).filter(User.email == oauth_data.email).first()
            
            if db_user:
                # Link existing account with OAuth
                db_user.oauth_provider = oauth_data.provider
                db_user.oauth_id = oauth_data.provider_id
                if oauth_data.picture and not db_user.profile_picture:
                    db_user.profile_picture = oauth_data.picture
            else:
                # Create new OAuth user
                # Generate unique username from email
                base_username = oauth_data.email.split('@')[0].lower()
                username = base_username
                counter = 1
                while db.query(User).filter(User.username == username).first():
                    username = f"{base_username}{counter}"
                    counter += 1
                
                # Split name into first and last name
                name_parts = oauth_data.name.strip().split(' ', 1)
                first_name = name_parts[0] if name_parts else ""
                last_name = name_parts[1] if len(name_parts) > 1 else ""
                
                # Get default user role
                default_role = db.query(Role).filter(Role.role_name == "user").first()
                if not default_role:
                    # Create default role if it doesn't exist
                    default_role = Role(role_name="user")
                    db.add(default_role)
                    db.flush()
                
                db_user = User(
                    email=oauth_data.email,
                    username=username,
                    first_name=first_name,
                    last_name=last_name,
                    oauth_provider=oauth_data.provider,
                    oauth_id=oauth_data.provider_id,
                    profile_picture=oauth_data.picture,
                    role_id=default_role.role_id,
                    password=None  # No password for OAuth users
                )
                db.add(db_user)
            
            db.commit()
            db.refresh(db_user)
        
        # Generate JWT token
        user_role = db_user.role.role_name if db_user.role else None
        access_token = create_access_token(data={
            "email": db_user.email,
            "role": user_role,
            "user_id": db_user.user_id
        })
        
        return {"access_token": access_token, "token_type": "bearer"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OAuth authentication failed: {str(e)}"
        )

# Refresh token route - this code will allow the token to be refreshed if the user is still active. That way he will continue to gain access to app usage even after the token expiry
@router.post("/refresh")
async def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    try:
        # Decode the refresh token to get user details
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

        # Get the user from the database
        user = db.query(User).filter(User.user_id == int(user_id)).first()
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        
        # Generate a new access token
        new_access_token = create_access_token(data={
            "user_id": user.user_id, 
            "email": user.email, 
            "role": user.role.role_name if user.role else None
        })

        return {"access_token": new_access_token, "token_type": "bearer"}

    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

