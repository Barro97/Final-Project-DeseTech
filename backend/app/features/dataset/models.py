from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, text
from sqlalchemy.orm import relationship
from backend.app.database.base import Base


class Dataset(Base):
    __tablename__ = 'dataset'

    dataset_id = Column(Integer, primary_key=True, autoincrement=True)
    dataset_name = Column(String(255), nullable=False)
    date_of_creation = Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    dataset_last_updated = Column(DateTime)
    dataset_description = Column(Text)
    downloads_count = Column(Integer, nullable=False, server_default=text("0"))
    uploader_id = Column(Integer, ForeignKey('users.user_id'))

    # Relationships
    uploader = relationship("User", back_populates="datasets")
    comments = relationship("Comment", back_populates="dataset")
    files = relationship("File", back_populates="dataset")
    likes = relationship("Like", back_populates="dataset")
    tags = relationship("DatasetTag", back_populates="dataset")
    owners = relationship("User", secondary=dataset_owner_table, back_populates="datasets_owned")


class DatasetTag(Base):
    __tablename__ = 'dataset_tag'
    # Composite primary key on (dataset_id, tag_id)
    dataset_id = Column(Integer, ForeignKey('dataset.dataset_id'), primary_key=True)
    tag_id = Column(Integer, ForeignKey('tag.tag_id'), primary_key=True)

    # Relationships
    dataset = relationship("Dataset", back_populates="tags")
    tag = relationship("Tag", back_populates="datasets") 

class DatasetOwner(Base):
    __tablename__ = 'dataset_owner'
    # Composite primary key on (dataset_id, user_id)
    dataset_id = Column(Integer, ForeignKey('dataset.dataset_id'), primary_key=True)
    user_id = Column(Integer, ForeignKey('user.user_id'), primary_key=True)

    # Relationships
    dataset = relationship("Dataset", back_populates="owner_links")
    user = relationship("User", back_populates="dataset_links")