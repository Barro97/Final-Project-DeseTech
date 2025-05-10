from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from backend.app.database.base import Base


class Tag(Base):
    __tablename__ = 'tag'

    tag_id = Column(Integer, primary_key=True, autoincrement=True)
    tag_category_name = Column(String(255), nullable=False)

    # Relationship to DatasetTag
    datasets = relationship("DatasetTag", back_populates="tag") 