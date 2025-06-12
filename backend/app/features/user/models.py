from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from backend.app.database.base import Base
from backend.app.features.dataset.models import dataset_owner_table


class Role(Base):
    """Represents a user role in the system (e.g., admin, user)."""
    __tablename__ = 'roles'

    role_id = Column(Integer, primary_key=True, autoincrement=True)
    role_name = Column(String(255), nullable=False, unique=True)

    # One-to-many: one role can be assigned to many users
    users = relationship("User", back_populates="role")


class User(Base):
    """Represents a user in the system with comprehensive profile support."""
    __tablename__ = 'users'

    user_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    username = Column(String(255), nullable=False, unique=True, index=True)
    first_name = Column(String(255))
    last_name = Column(String(255))
    gender = Column(String(50))
    password = Column(String(255), nullable=False)
    country = Column(String(255))
    profile_picture = Column(Text)
    education = Column(String(255))
    organization = Column(String(255))
    role_id = Column(Integer, ForeignKey('roles.role_id'))
    
    # Admin management fields
    status = Column(String(20), nullable=False, server_default=text("'active'"))
    last_login = Column(DateTime, nullable=True)
    created_by = Column(Integer, ForeignKey('users.user_id'), nullable=True)

    # Profile fields (simplified JSON approach)
    title = Column(String(255))                              # Professional title/headline
    bio = Column(Text)                                       # Short biography
    about_me = Column(Text)                                  # Detailed about section
    cover_photo_url = Column(Text)                           # Cover photo URL
    skills = Column(JSONB)                                   # Skills array with categories
    projects = Column(JSONB)                                 # Projects/publications array
    contact_info = Column(JSONB)                             # Contact info with privacy settings
    privacy_level = Column(String(20), server_default='public')  # Profile privacy level
    profile_completion_percentage = Column(Integer, server_default='0')  # Completion tracking

    # Relationships
    role = relationship("Role", back_populates="users")
    datasets = relationship("Dataset", back_populates="uploader", foreign_keys="[Dataset.uploader_id]")
    comments = relationship("Comment", back_populates="user")
    likes = relationship("Like", back_populates="user")
    datasets_owned = relationship("Dataset", secondary=dataset_owner_table, back_populates="owners")
    created_by_user = relationship("User", remote_side=[user_id])
 