from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class CommentBase(BaseModel):
    comment_text: Optional[str] = None
    user_id: Optional[int] = None
    dataset_id: Optional[int] = None

class CommentCreate(CommentBase):
    pass

class Comment(CommentBase):
    comment_id: int
    comment_dt: datetime

    class Config:
        orm_mode = True