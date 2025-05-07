from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, text
from sqlalchemy.orm import relationship
from backend.app.database.base import Base


class File(Base):
    __tablename__ = 'files'

    file_id = Column(Integer, primary_key=True, autoincrement=True)
    file_date_of_upload = Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50))
    size = Column(Integer)
    file_url = Column(Text)
    dataset_id = Column(Integer, ForeignKey('dataset.dataset_id'))

    # Relationship
    dataset = relationship("Dataset", back_populates="files") 