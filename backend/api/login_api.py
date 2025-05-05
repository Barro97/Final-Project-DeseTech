from fastapi import Depends, APIRouter, HTTPException, status
from sqlalchemy.orm import Session
from backend.database.session import get_db
from passlib.context import CryptContext
from backend.schemas.user import UserLogin
from backend.database.models import User
from backend import crud

router = APIRouter()

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
    access_token = create_access_token(data={"email": db_user.email,
                                             "role": db_user.role.name,
    })
    
    # Return the token in response
    return {"access_token": access_token, "token_type": "bearer"}
