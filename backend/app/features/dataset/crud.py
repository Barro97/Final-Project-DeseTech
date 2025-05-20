from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException

from backend.app.database.models import Dataset, Tag, File, User
from backend.app.features.dataset.schemas import DatasetCreate, OwnerActionRequest
from backend.app.features.file.utils.upload import delete_file_from_storage
from typing import List


def create_dataset_service(db: Session, dataset_in: DatasetCreate):
    # Check if uploader exists
    uploader = db.query(User).filter_by(user_id=dataset_in.uploader_id).first()
    if not uploader:
        raise HTTPException(status_code=400, detail="Uploader not found")

    db_dataset = Dataset(
        dataset_name=dataset_in.dataset_name,
        dataset_description=dataset_in.dataset_description,
        uploader_id=dataset_in.uploader_id,
    )
    
    db.add(db_dataset)
    db.commit()
    db.refresh(db_dataset)
    
    # Add uploader as initial owner
    db_dataset.owners = [uploader]
    db.commit()
    db.refresh(db_dataset)
    
    return db_dataset


def get_dataset_service(db: Session, dataset_id: int):
    dataset = db.query(Dataset).filter(Dataset.dataset_id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset


def update_dataset_service(db: Session, dataset_id: int, dataset_in: DatasetCreate):
    db_dataset = db.query(Dataset).filter_by(dataset_id=dataset_id).first()
    if not db_dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    # Update fields
    db_dataset.dataset_name = dataset_in.dataset_name
    db_dataset.dataset_description = dataset_in.dataset_description
    db_dataset.downloads_count = dataset_in.downloads_count # Assuming this is intended, though not in original create
    db_dataset.uploader_id = dataset_in.uploader_id # Allow uploader change

    # Update tags
    tag_objects = []
    if dataset_in.tags: # Ensure tags are provided
        for tag_name in dataset_in.tags:
            tag = db.query(Tag).filter_by(tag_category_name=tag_name).first()
            if not tag:
                tag = Tag(tag_category_name=tag_name)
                db.add(tag)
                # Commit and refresh for each new tag if necessary, or batch commit later
            tag_objects.append(tag)
    db_dataset.tags = tag_objects

    # Update owner - ensure uploader is an owner. Consider if other owners should be preserved or replaced.
    # Current logic replaces all owners with only the uploader.
    uploader = db.query(User).filter_by(user_id=dataset_in.uploader_id).first()
    if not uploader:
        raise HTTPException(status_code=400, detail="Uploader not found for ownership assignment")
    db_dataset.owners = [uploader]

    db.commit()
    db.refresh(db_dataset)
    return db_dataset


def delete_dataset_service(db: Session, dataset_id: int):
    db_dataset = db.query(Dataset).filter_by(dataset_id=dataset_id).first()
    if not db_dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    # Delete all associated files from storage
    for file_obj in db_dataset.files: # Renamed file to file_obj to avoid conflict
        try:
            delete_file_from_storage(file_obj.file_url)
        except Exception as e:
            # Log the error but continue; consider how to handle partial failures
            print(f"Error deleting file {file_obj.file_id} from storage: {str(e)}")
            # Optionally re-raise or collect errors
            raise HTTPException(
                status_code=500,
                detail=f"Error deleting file {file_obj.file_url} from storage: {str(e)}"
            )
            
    # Deletion of db_dataset will cascade to File records and dataset_owner associations
    # due to relationships and cascade rules defined in models.
    db.delete(db_dataset)
    db.commit()
    return True # Indicates successful deletion


def add_dataset_owner_service(db: Session, dataset_id: int, owner_request: OwnerActionRequest):
    dataset = db.query(Dataset).filter(Dataset.dataset_id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    user = db.query(User).filter(User.user_id == owner_request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user in dataset.owners:
        raise HTTPException(status_code=400, detail="User is already an owner")

    dataset.owners.append(user)
    db.commit()
    return dataset


def remove_dataset_owner_service(db: Session, dataset_id: int, owner_request: OwnerActionRequest):
    dataset = db.query(Dataset).filter(Dataset.dataset_id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    user = db.query(User).filter(User.user_id == owner_request.user_id).first()
    if not user: # Check if user exists before checking if they are an owner
        raise HTTPException(status_code=404, detail="User not found")
        
    if user not in dataset.owners:
        raise HTTPException(status_code=400, detail="User is not an owner of this dataset")

    dataset.owners.remove(user)
    db.commit()
    return dataset


def get_user_datasets_service(db: Session, user_id: int):
    # Query datasets where user is either uploader or owner
    datasets = db.query(Dataset).filter(
        or_(
            Dataset.uploader_id == user_id,
            Dataset.owners.any(User.user_id == user_id)
        )
    ).all()
    if not datasets:
        # It's not an error if a user has no datasets, return empty list.
        # Consider if HTTPException for not found is appropriate here or just empty list.
        # For now, align with previous logic of returning empty list implicitly if none found.
        return []
    return datasets


def get_dataset_files_service(db: Session, dataset_id: int):
    # Check if dataset exists first, as per original logic
    dataset = db.query(Dataset).filter(Dataset.dataset_id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    files = db.query(File).filter(File.dataset_id == dataset_id).all()
    # It's not an error if a dataset has no files, return empty list.
    return files 