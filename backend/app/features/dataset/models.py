from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, text, Table
from sqlalchemy.orm import relationship
from backend.app.database.base import Base

# Association table for many-to-many relationship between Dataset and User (owners)
dataset_owner_table = Table(
    'dataset_owner',
    Base.metadata,
    Column('dataset_id', Integer, ForeignKey('dataset.dataset_id'), primary_key=True),
    Column('user_id', Integer, ForeignKey('users.user_id'), primary_key=True)
)

# database creation model for 'dataset'
class Dataset(Base):
    __tablename__ = 'dataset'

    dataset_id = Column(Integer, primary_key=True, autoincrement=True)
    dataset_name = Column(String(255), nullable=False)
    date_of_creation = Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    dataset_last_updated = Column(DateTime)
    dataset_description = Column(Text)
    downloads_count = Column(Integer, nullable=False, server_default=text("0"))
    uploader_id = Column(Integer, ForeignKey('users.user_id'))
    
    # Agricultural research context fields
    geographic_location = Column(Text, nullable=True)  # Location where data was collected (country, region, farm, coordinates, etc.)
    data_time_period = Column(String(100), nullable=True)  # Time period when data was relevant (e.g., "2020-2023", "Growing season 2022")
    
    # Admin approval fields
    approval_status = Column(String(20), nullable=False, server_default=text("'pending'"))
    approved_by = Column(Integer, ForeignKey('users.user_id'), nullable=True)
    approval_date = Column(DateTime, nullable=True)

    # Relationships
    uploader = relationship("User", back_populates="datasets", foreign_keys=[uploader_id])
    approver = relationship("User", foreign_keys=[approved_by])
    comments = relationship("Comment", back_populates="dataset")
    files = relationship("File", back_populates="dataset")
    likes = relationship("Like", back_populates="dataset")
    tags = relationship("Tag", secondary="dataset_tag", back_populates="datasets")
    owners = relationship("User", secondary=dataset_owner_table, back_populates="datasets_owned")

# creation of the dataset-tag table for the proper relationship
class DatasetTag(Base):
    __tablename__ = 'dataset_tag'
    # Composite primary key on (dataset_id, tag_id)
    dataset_id = Column(Integer, ForeignKey('dataset.dataset_id'), primary_key=True)
    tag_id = Column(Integer, ForeignKey('tag.tag_id'), primary_key=True)

    # Relationships (without back_populates since we're using secondary table for many-to-many)
    dataset = relationship("Dataset")
    tag = relationship("Tag")

# Admin audit trail model
class AdminAudit(Base):
    """Audit trail for admin actions on datasets and users."""
    __tablename__ = 'admin_audit'

    audit_id = Column(Integer, primary_key=True, autoincrement=True)
    admin_user_id = Column(Integer, ForeignKey('users.user_id'), nullable=False)
    action_type = Column(String(50), nullable=False)  # approve, reject, delete, role_update, etc.
    target_type = Column(String(20), nullable=False)  # dataset, user
    target_id = Column(Integer, nullable=False)  # ID of the target entity
    action_details = Column(Text, nullable=True)  # Additional details about the action
    timestamp = Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))

    # Relationship to admin user
    admin_user = relationship("User", foreign_keys=[admin_user_id])

# Note: The DatasetOwner class is not needed since we use the association table above
# for the many-to-many relationship between Dataset and User