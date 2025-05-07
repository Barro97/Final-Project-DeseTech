from sqlalchemy import Column, Integer, DateTime, ForeignKey, text
from sqlalchemy.orm import relationship
from app.database.base import Base


class Like(Base):
    __tablename__ = 'likes'

    like_id = Column(Integer, primary_key=True, autoincrement=True)
    like_dt = Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    user_id = Column(Integer, ForeignKey('users.user_id'))
    dataset_id = Column(Integer, ForeignKey('dataset.dataset_id'))

    # Relationships
    user = relationship("User", back_populates="likes")
    dataset = relationship("Dataset", back_populates="likes") 