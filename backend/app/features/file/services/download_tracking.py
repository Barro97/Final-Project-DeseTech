"""
Download Tracking Service - Business Logic for User Download Management

This module implements the Service Layer Pattern for download tracking, providing:
- Smart download count management that prevents abuse
- User download history tracking
- Analytics for download patterns
- Transaction safety with proper rollback handling

BUSINESS LOGIC:
├── **Unique User Tracking**: Each user can only increment dataset count once
├── **Download Type Support**: Handles both file and dataset downloads
├── **Analytics Ready**: Provides detailed download statistics
├── **Race Condition Safe**: Uses database constraints to prevent conflicts
└── **Audit Trail**: Maintains complete download history

DOWNLOAD COUNT STRATEGY:
- First download by user increments dataset.downloads_count
- Subsequent downloads by same user don't affect the count
- Actual download frequency is tracked for analytics
- Both file and dataset downloads are considered equivalent
"""
import logging
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func, desc

from backend.app.features.file.models import UserDownload
from backend.app.database.models import Dataset, File, User

logger = logging.getLogger(__name__)


class DownloadTrackingService:
    """
    Service layer for download tracking following established patterns.
    
    This service handles all download-related business logic including:
    - Unique user download tracking
    - Dataset download count management
    - Download analytics and reporting
    - Race condition handling
    
    DESIGN PRINCIPLES:
    - **Transaction Safety**: All operations wrapped in proper transactions
    - **Race Condition Handling**: Uses database constraints + try/catch
    - **Business Logic Encapsulation**: All download rules centralized
    - **Analytics Ready**: Rich data collection for insights
    - **Error Resilience**: Download failures don't prevent file access
    """

    def track_download(self, db: Session, user_id: int, dataset_id: int, 
                      download_type: str, file_id: Optional[int] = None) -> Dict[str, any]:
        """
        Track user download and update dataset count if first time.
        
        This method implements the core business logic for smart download counting:
        1. Checks if user has downloaded this dataset before
        2. If first time: creates record and increments dataset count
        3. If repeat: updates frequency count only
        4. Handles race conditions gracefully
        
        Args:
            db: Database session for transaction
            user_id: ID of user downloading
            dataset_id: ID of dataset being downloaded
            download_type: Type of download ('file' or 'dataset')
            file_id: Optional file ID for file downloads
            
        Returns:
            Dict containing:
                - is_first_download: bool - Whether this incremented the count
                - total_user_downloads: int - User's total downloads of this dataset
                - dataset_download_count: int - Current dataset total count
                
        Raises:
            Exception: Re-raises any database errors for handling by caller
        """
        try:
            # STEP 1: Check for existing download record
            existing_download = db.query(UserDownload).filter(
                UserDownload.user_id == user_id,
                UserDownload.dataset_id == dataset_id
            ).first()
            
            if existing_download:
                # STEP 2A: User has downloaded before - update frequency only
                existing_download.total_download_count += 1
                existing_download.last_download_date = datetime.now()
                
                # Update download type if it's different (file vs dataset)
                if existing_download.download_type != download_type:
                    existing_download.download_type = 'mixed'  # User has done both types
                
                db.commit()
                
                # Get current dataset count for response
                dataset = db.query(Dataset).filter(Dataset.dataset_id == dataset_id).first()
                current_count = dataset.downloads_count if dataset else 0
                
                logger.info(f"User {user_id} repeat download of dataset {dataset_id}, count: {existing_download.total_download_count}")
                
                return {
                    "is_first_download": False,
                    "total_user_downloads": existing_download.total_download_count,
                    "dataset_download_count": current_count
                }
            
            else:
                # STEP 2B: First time download - create record and increment count
                try:
                    # Create new download record
                    new_download = UserDownload(
                        user_id=user_id,
                        dataset_id=dataset_id,
                        download_type=download_type,
                        file_id=file_id,
                        first_download_date=datetime.now(),
                        last_download_date=datetime.now(),
                        total_download_count=1
                    )
                    db.add(new_download)
                    
                    # Increment dataset download count
                    dataset = db.query(Dataset).filter(Dataset.dataset_id == dataset_id).first()
                    if dataset:
                        dataset.downloads_count += 1
                        new_count = dataset.downloads_count
                    else:
                        new_count = 0
                        logger.warning(f"Dataset {dataset_id} not found when tracking download")
                    
                    db.commit()
                    
                    logger.info(f"User {user_id} first download of dataset {dataset_id}, new count: {new_count}")
                    
                    return {
                        "is_first_download": True,
                        "total_user_downloads": 1,
                        "dataset_download_count": new_count
                    }
                    
                except IntegrityError:
                    # STEP 3: Handle race condition - another process created the record
                    db.rollback()
                    logger.info(f"Race condition detected for user {user_id}, dataset {dataset_id} - retrying as repeat download")
                    
                    # Retry as repeat download
                    existing_download = db.query(UserDownload).filter(
                        UserDownload.user_id == user_id,
                        UserDownload.dataset_id == dataset_id
                    ).first()
                    
                    if existing_download:
                        existing_download.total_download_count += 1
                        existing_download.last_download_date = datetime.now()
                        db.commit()
                        
                        dataset = db.query(Dataset).filter(Dataset.dataset_id == dataset_id).first()
                        current_count = dataset.downloads_count if dataset else 0
                        
                        return {
                            "is_first_download": False,
                            "total_user_downloads": existing_download.total_download_count,
                            "dataset_download_count": current_count
                        }
                    else:
                        # This shouldn't happen, but handle gracefully
                        logger.error(f"Race condition resolution failed for user {user_id}, dataset {dataset_id}")
                        raise Exception("Download tracking failed due to race condition")
                        
        except Exception as e:
            db.rollback()
            logger.error(f"Error tracking download for user {user_id}, dataset {dataset_id}: {str(e)}")
            raise

    def get_user_download_history(self, db: Session, user_id: int, 
                                 limit: int = 50) -> List[Dict[str, any]]:
        """
        Get download history for a specific user.
        
        Args:
            db: Database session
            user_id: User to get history for
            limit: Maximum number of records to return
            
        Returns:
            List of download records with dataset information
        """
        downloads = db.query(UserDownload).join(
            Dataset, UserDownload.dataset_id == Dataset.dataset_id
        ).filter(
            UserDownload.user_id == user_id
        ).order_by(
            desc(UserDownload.last_download_date)
        ).limit(limit).all()
        
        history = []
        for download in downloads:
            history.append({
                "dataset_id": download.dataset_id,
                "dataset_name": download.dataset.dataset_name,
                "first_download_date": download.first_download_date,
                "last_download_date": download.last_download_date,
                "download_type": download.download_type,
                "total_downloads": download.total_download_count
            })
        
        return history

    def get_dataset_download_stats(self, db: Session, dataset_id: int) -> Dict[str, any]:
        """
        Get detailed download statistics for a dataset.
        
        Args:
            db: Database session
            dataset_id: Dataset to analyze
            
        Returns:
            Dictionary with comprehensive download analytics
        """
        # Get basic dataset info
        dataset = db.query(Dataset).filter(Dataset.dataset_id == dataset_id).first()
        if not dataset:
            return {"error": "Dataset not found"}
        
        # Get download records for this dataset
        downloads = db.query(UserDownload).filter(
            UserDownload.dataset_id == dataset_id
        ).all()
        
        # Calculate statistics
        unique_downloaders = len(downloads)
        total_download_events = sum(d.total_download_count for d in downloads)
        
        # Download type breakdown
        file_downloads = len([d for d in downloads if d.download_type == 'file'])
        dataset_downloads = len([d for d in downloads if d.download_type == 'dataset'])
        mixed_downloads = len([d for d in downloads if d.download_type == 'mixed'])
        
        # Average downloads per user
        avg_downloads_per_user = total_download_events / unique_downloaders if unique_downloaders > 0 else 0
        
        return {
            "dataset_id": dataset_id,
            "dataset_name": dataset.dataset_name,
            "official_download_count": dataset.downloads_count,
            "unique_downloaders": unique_downloaders,
            "total_download_events": total_download_events,
            "average_downloads_per_user": round(avg_downloads_per_user, 2),
            "download_type_breakdown": {
                "file_only": file_downloads,
                "dataset_only": dataset_downloads,
                "mixed": mixed_downloads
            }
        }

    def get_platform_download_stats(self, db: Session) -> Dict[str, any]:
        """
        Get platform-wide download statistics for admin dashboard.
        
        Args:
            db: Database session
            
        Returns:
            Dictionary with platform-wide download metrics
        """
        # Total unique download relationships
        total_unique_downloads = db.query(UserDownload).count()
        
        # Total download events
        total_events = db.query(func.sum(UserDownload.total_download_count)).scalar() or 0
        
        # Most downloaded datasets
        popular_datasets = db.query(
            Dataset.dataset_id,
            Dataset.dataset_name,
            Dataset.downloads_count
        ).order_by(
            desc(Dataset.downloads_count)
        ).limit(10).all()
        
        # Most active downloaders
        active_users = db.query(
            UserDownload.user_id,
            func.count(UserDownload.dataset_id).label('datasets_downloaded'),
            func.sum(UserDownload.total_download_count).label('total_downloads')
        ).group_by(
            UserDownload.user_id
        ).order_by(
            desc('total_downloads')
        ).limit(10).all()
        
        return {
            "total_unique_downloads": total_unique_downloads,
            "total_download_events": total_events,
            "popular_datasets": [
                {
                    "dataset_id": d.dataset_id,
                    "dataset_name": d.dataset_name,
                    "download_count": d.downloads_count
                }
                for d in popular_datasets
            ],
            "active_users": [
                {
                    "user_id": u.user_id,
                    "datasets_downloaded": u.datasets_downloaded,
                    "total_downloads": u.total_downloads
                }
                for u in active_users
            ]
        }

    def is_first_download(self, db: Session, user_id: int, dataset_id: int) -> bool:
        """
        Check if this would be the user's first download of the dataset.
        
        Args:
            db: Database session
            user_id: User to check
            dataset_id: Dataset to check
            
        Returns:
            True if user has never downloaded this dataset
        """
        existing = db.query(UserDownload).filter(
            UserDownload.user_id == user_id,
            UserDownload.dataset_id == dataset_id
        ).first()
        
        return existing is None 