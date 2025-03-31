from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    text
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Role(Base):
    __tablename__ = 'roles'

    role_id = Column(Integer, primary_key=True, autoincrement=True)
    role_name = Column(String(255), nullable=False)

    # One-to-many: one role can be assigned to many users
    users = relationship("User", back_populates="role")


class User(Base):
    __tablename__ = 'users'

    user_id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), nullable=False, unique=True)
    username = Column(String(255), nullable=False, unique=True)
    first_name = Column(String(255))
    last_name = Column(String(255))
    gender = Column(String(50))
    password = Column(String(255), nullable=False)
    country = Column(String(255))
    profile_picture = Column(Text)
    education = Column(String(255))
    organization = Column(String(255))
    role_id = Column(Integer, ForeignKey('roles.role_id'))

    # Relationships
    role = relationship("Role", back_populates="users")
    datasets = relationship("Dataset", back_populates="uploader")
    comments = relationship("Comment", back_populates="user")
    likes = relationship("Like", back_populates="user")


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


class DatasetTag(Base):
    __tablename__ = 'dataset_tag'
    # Composite primary key on (dataset_id, tag_id)
    dataset_id = Column(Integer, ForeignKey('dataset.dataset_id'), primary_key=True)
    tag_id = Column(Integer, ForeignKey('tag.tag_id'), primary_key=True)

    # Relationships
    dataset = relationship("Dataset", back_populates="tags")
    tag = relationship("Tag", back_populates="datasets")


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


class Like(Base):
    __tablename__ = 'likes'

    like_id = Column(Integer, primary_key=True, autoincrement=True)
    like_dt = Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    user_id = Column(Integer, ForeignKey('users.user_id'))
    dataset_id = Column(Integer, ForeignKey('dataset.dataset_id'))

    # Relationships
    user = relationship("User", back_populates="likes")
    dataset = relationship("Dataset", back_populates="likes")


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


class Tag(Base):
    __tablename__ = 'tag'

    tag_id = Column(Integer, primary_key=True, autoincrement=True)
    tag_category_name = Column(String(255), nullable=False)

    # Relationship to DatasetTag
    datasets = relationship("DatasetTag", back_populates="tag")
