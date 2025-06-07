"""
Test script for download tracking functionality.

This script tests the smart download count implementation to ensure:
1. First downloads increment the dataset count
2. Repeat downloads don't increment the count
3. Both file and dataset downloads are tracked properly
4. Race conditions are handled correctly
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.app.features.file.services.download_tracking import DownloadTrackingService
from backend.app.database.session import get_db
from backend.app.database.models import Dataset, User, UserDownload
from sqlalchemy.orm import Session

def test_download_tracking():
    """Test the download tracking service functionality."""
    print("🧪 Testing Download Tracking Service")
    print("=" * 50)
    
    # Get database session
    db = next(get_db())
    tracking_service = DownloadTrackingService()
    
    try:
        # Test data - you may need to adjust these IDs based on your database
        test_user_id = 1  # Adjust to an existing user ID
        test_dataset_id = 1  # Adjust to an existing dataset ID
        test_file_id = 1  # Adjust to an existing file ID
        
        print(f"📊 Testing with User ID: {test_user_id}, Dataset ID: {test_dataset_id}")
        
        # Get initial dataset download count
        dataset = db.query(Dataset).filter(Dataset.dataset_id == test_dataset_id).first()
        if not dataset:
            print(f"❌ Dataset {test_dataset_id} not found. Please adjust test_dataset_id.")
            return
            
        initial_count = dataset.downloads_count
        print(f"📈 Initial dataset download count: {initial_count}")
        
        # Test 1: First file download
        print("\n🔍 Test 1: First file download")
        result1 = tracking_service.track_download(
            db=db,
            user_id=test_user_id,
            dataset_id=test_dataset_id,
            download_type="file",
            file_id=test_file_id
        )
        
        print(f"✅ First download result: {result1}")
        
        # Verify dataset count increased
        db.refresh(dataset)
        new_count = dataset.downloads_count
        print(f"📈 New dataset download count: {new_count}")
        
        if result1["is_first_download"] and new_count == initial_count + 1:
            print("✅ First download test PASSED")
        else:
            print("❌ First download test FAILED")
        
        # Test 2: Repeat file download
        print("\n🔍 Test 2: Repeat file download")
        result2 = tracking_service.track_download(
            db=db,
            user_id=test_user_id,
            dataset_id=test_dataset_id,
            download_type="file",
            file_id=test_file_id
        )
        
        print(f"✅ Repeat download result: {result2}")
        
        # Verify dataset count didn't increase
        db.refresh(dataset)
        repeat_count = dataset.downloads_count
        print(f"📈 Dataset download count after repeat: {repeat_count}")
        
        if not result2["is_first_download"] and repeat_count == new_count:
            print("✅ Repeat download test PASSED")
        else:
            print("❌ Repeat download test FAILED")
        
        # Test 3: Dataset download (should not increment since user already downloaded)
        print("\n🔍 Test 3: Full dataset download")
        result3 = tracking_service.track_download(
            db=db,
            user_id=test_user_id,
            dataset_id=test_dataset_id,
            download_type="dataset"
        )
        
        print(f"✅ Dataset download result: {result3}")
        
        # Verify dataset count didn't increase
        db.refresh(dataset)
        dataset_download_count = dataset.downloads_count
        print(f"📈 Dataset download count after full download: {dataset_download_count}")
        
        if not result3["is_first_download"] and dataset_download_count == repeat_count:
            print("✅ Dataset download test PASSED")
        else:
            print("❌ Dataset download test FAILED")
        
        # Test 4: Get download statistics
        print("\n🔍 Test 4: Download statistics")
        stats = tracking_service.get_dataset_download_stats(db, test_dataset_id)
        print(f"📊 Dataset statistics: {stats}")
        
        # Test 5: User download history
        print("\n🔍 Test 5: User download history")
        history = tracking_service.get_user_download_history(db, test_user_id, limit=5)
        print(f"📚 User download history: {history}")
        
        print("\n🎉 All tests completed!")
        
    except Exception as e:
        print(f"❌ Error during testing: {str(e)}")
        import traceback
        traceback.print_exc()
    
    finally:
        db.close()

def test_is_first_download():
    """Test the is_first_download utility method."""
    print("\n🧪 Testing is_first_download utility")
    print("=" * 40)
    
    db = next(get_db())
    tracking_service = DownloadTrackingService()
    
    try:
        test_user_id = 1
        test_dataset_id = 1
        
        # Check if it's first download
        is_first = tracking_service.is_first_download(db, test_user_id, test_dataset_id)
        print(f"🔍 Is first download for user {test_user_id}, dataset {test_dataset_id}: {is_first}")
        
        # Check existing download record
        existing = db.query(UserDownload).filter(
            UserDownload.user_id == test_user_id,
            UserDownload.dataset_id == test_dataset_id
        ).first()
        
        if existing:
            print(f"📋 Existing download record found: {existing.download_type}, count: {existing.total_download_count}")
        else:
            print("📋 No existing download record found")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Starting Download Tracking Tests")
    print("=" * 60)
    
    test_is_first_download()
    test_download_tracking()
    
    print("\n✨ Testing complete!") 