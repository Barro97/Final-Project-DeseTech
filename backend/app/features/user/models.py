from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database.base import Base


class Role(Base):
    """Represents a user role in the system (e.g., admin, user)."""
    __tablename__ = 'roles'

    role_id = Column(Integer, primary_key=True, autoincrement=True)
    role_name = Column(String(255), nullable=False, unique=True)

    # One-to-many: one role can be assigned to many users
    users = relationship("User", back_populates="role")


class User(Base):
    """Represents a user in the system."""
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

    # Relationships
    role = relationship("Role", back_populates="users")
    datasets = relationship("Dataset", back_populates="uploader")
    comments = relationship("Comment", back_populates="user")
    likes = relationship("Like", back_populates="user")
    datasets_owned = relationship("Dataset", secondary=dataset_owner_table, back_populates="owners")
 