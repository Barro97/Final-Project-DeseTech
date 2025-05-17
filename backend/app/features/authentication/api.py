from fastapi import Depends, APIRouter, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from passlib.context import CryptContext
from backend.app.features.user.schemas import UserLogin
from backend.app.database.models import User
from backend.app.features.authentication.utils.token_creation import create_access_token
from jose import JWTError, jwt
from backend.app.features.authentication.utils.token_creation import SECRET_KEY, ALGORITHM

router = APIRouter(prefix='/auth')

# Set up password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Login Route
@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    # Step 1: Check if user exists in the database
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    # Step 2: Verify the password
    if not pwd_context.verify(user.password, db_user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    # Step 3: If valid credentials, generate the JWT token
    # Safely access role name
    user_role = db_user.role.role_name if db_user.role else None
    access_token = create_access_token(data={
        "email": db_user.email,
        "role": user_role,
        'user_id': db_user.user_id
    })
    
    # Return the token in response
    return {"access_token": access_token, "token_type": "bearer"}

# Refresh token route
@router.post("/refresh")
async def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    try:
        # Decode the refresh token to get user details
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

        # Get the user from the database
        user = db.query(User).filter(User.user_id == user_id).first()
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        
        # Generate a new access token
        new_access_token = create_access_token(data={
            "user_id": user.user_id,
            "email": user.email,
            "role": user.role.role_name
        })

        return {"access_token": new_access_token, "token_type": "bearer"}

    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

