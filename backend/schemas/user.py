from typing import Optional
from pydantic import BaseModel

class UserBase(BaseModel):
    email: str
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    gender: Optional[str] = None
    country: Optional[str] = None
    profile_picture: Optional[str] = None
    education: Optional[str] = None
    organization: Optional[str] = None
    role_id: Optional[int] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserDelete(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class UserUpdate(UserBase):
    pass

class User(UserBase):
    id: int

    class Config:
        orm_mode = True

