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
router = APIRouter(prefix='/auth')

# Set up password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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

# TEMPORARY DEBUG ENDPOINT - Remove in production
@router.post("/make-me-admin")
def make_me_admin(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Temporary endpoint to make current user admin. REMOVE IN PRODUCTION!"""
    try:
        # Get admin role (try both cases)
        admin_role = db.query(Role).filter(
            Role.role_name.ilike("admin")  # Case-insensitive search
        ).first()
        if not admin_role:
            raise HTTPException(status_code=500, detail="Admin role not found in database")
        
        # Get current user
        user = db.query(User).filter(User.user_id == current_user["user_id"]).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if user is already admin
        if user.role and user.role.role_name.lower() == "admin":
            return {
                "message": f"User {user.email} is already an admin",
                "user_id": user.user_id,
                "current_role": user.role.role_name
            }
        
        # Update user role
        user.role_id = admin_role.role_id
        db.commit()
        
        return {
            "message": f"User {user.email} is now an admin",
            "user_id": user.user_id,
            "new_role": admin_role.role_name
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

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

