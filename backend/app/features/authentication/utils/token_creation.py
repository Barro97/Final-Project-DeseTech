from jose import JWTError, jwt
from datetime import datetime, timedelta
from app.core.config import JWT_SECRET_KEY, JWT_ALGORITHM, JWT_ACCESS_TOKEN_EXPIRE_MINUTES

# Create token
def create_access_token(data: dict):
    to_encode = data.copy()

    # Handle both 'id' and 'user_id' keys - get the user ID from either key
    user_id = data.get("user_id") or data.get("id")
    if user_id is None:
        raise ValueError("Token data must include either 'user_id' or 'id'")

    # Include a user ID in the standard "sub" field
    to_encode.update({"sub": str(user_id)})
    
    # Make sure both id and user_id are available for consistency
    to_encode.update({"id": user_id, "user_id": user_id})

    # Set expiration time
    expire = datetime.utcnow() + timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})

    # Create the JWT token
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt      

def verify_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        return {'error_message':'Signature invalid'}


        