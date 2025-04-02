from datetime import datetime
from pydantic import BaseModel

class LikeBase(BaseModel):
    user_id: int
    dataset_id: int

class LikeCreate(LikeBase):
    pass

class Like(LikeBase):
    like_id: int
    like_dt: datetime

    class Config:
        orm_mode = True