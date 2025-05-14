from jose import JWTError, jwt
from datetime import datetime, timedelta

# Define some constants
SECRET_KEY = "gershonisamazing231456724134525699"  # 🔴 Important: Use a strong secret key, don't hardcode in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # 🔥 Token valid for 60 minutes

# Create token
def create_access_token(data: dict):
    to_encode = data.copy()

    # Include a user ID in the standard "sub" field
    to_encode.update({"sub": str(data["id"])})

    # Set expiration time
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})

    # Create the JWT token
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt      

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return {'error_message':'Signature invalid'}


        