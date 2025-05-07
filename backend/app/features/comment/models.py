from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, text
from sqlalchemy.orm import relationship
from backend.app.database.base import Base


class Comment(Base):
    __tablename__ = 'comment'

    comment_id = Column(Integer, primary_key=True, autoincrement=True)
    comment_dt = Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    comment_text = Column(Text)
    user_id = Column(Integer, ForeignKey('users.user_id'))
    dataset_id = Column(Integer, ForeignKey('dataset.dataset_id'))

    # Relationships
    user = relationship("User", back_populates="comments")
    dataset = relationship("Dataset", back_populates="comments") 