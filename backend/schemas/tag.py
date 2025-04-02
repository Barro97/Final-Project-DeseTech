from pydantic import BaseModel

class TagBase(BaseModel):
    tag_category_name: str

class TagCreate(TagBase):
    pass

class Tag(TagBase):
    tag_id: int

    class Config:
        orm_mode = True