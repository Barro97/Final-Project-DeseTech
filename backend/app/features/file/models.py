from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, text, UniqueConstraint
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


class UserDownload(Base):
    """
    Track unique user downloads to prevent abuse while allowing unlimited downloads.
    
    This model ensures each user can only increment the dataset download count once,
    regardless of how many times they actually download files or datasets.
    
    Business Rules:
    - One record per user per dataset (enforced by unique constraint)
    - Tracks both individual file downloads and full dataset downloads
    - Maintains actual download frequency for analytics
    - First download increments dataset.downloads_count, subsequent ones don't
    """
    __tablename__ = 'user_downloads'

    download_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.user_id'), nullable=False)
    dataset_id = Column(Integer, ForeignKey('dataset.dataset_id'), nullable=False)
    first_download_date = Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    last_download_date = Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    download_type = Column(String(20), nullable=False)  # 'file' or 'dataset'
    file_id = Column(Integer, ForeignKey('files.file_id'), nullable=True)  # NULL for dataset downloads
    total_download_count = Column(Integer, nullable=False, server_default=text("1"))
    
    # Relationships
    user = relationship("User")
    dataset = relationship("Dataset")
    file = relationship("File")
    
    # Ensure one record per user per dataset
    __table_args__ = (UniqueConstraint('user_id', 'dataset_id', name='uq_user_dataset_download'),) 