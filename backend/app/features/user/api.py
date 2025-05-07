from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.database.session import get_db
from backend.app.features.user.schemas import UserCreate, UserUpdate, User as UserSchema
from backend.app.features.user.crud import (
    create_user,
    get_user,
    update_user,
    delete_user,
)

router = APIRouter(
    prefix="/users",
    #tags=["users"]
)

@router.post("/create_new_user", status_code=status.HTTP_201_CREATED)
def create_new_user(user: UserCreate, db: Session = Depends(get_db)):
    return create_user(db=db, user=user)  

@router.get("/get_user_by_id/{user_id}") #,response_model=UserSchema
def read_user(user_id: int, db: Session = Depends(get_db)):
    return get_user(db=db, user_id=user_id)

@router.put("/update_user_info/{user_id}") #,response_model=UserSchema
def update_user_info(user_id: int, user: UserUpdate, db: Session = Depends(get_db)):
    return update_user(db=db, user_id=user_id, user_update=user)

@router.delete("/delete_user/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_user(user_id: int, db: Session = Depends(get_db)):
    delete_user(db=db, user_id=user_id)
    return None

@router.get("/admin-only")
def read_admin_data(user = Depends(role_required(["admin"]))):
    return {"msg": f"Hello {user.username}, you're an admin"}