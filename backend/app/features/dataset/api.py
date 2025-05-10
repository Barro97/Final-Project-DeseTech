from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from models import Dataset, Tag  # SQLAlchemy models
from schemas import DatasetCreate, Dataset as DatasetResponse
from database import get_db
from fastapi import HTTPException, Path

router = APIRouter()

@router.post("/datasets/", response_model=DatasetResponse)
def create_dataset(dataset_in: DatasetCreate, db: Session = Depends(get_db)):
    # 1. Create the dataset object
    db_dataset = Dataset(
        name=dataset_in.name,
        description=dataset_in.description,
        download_count=dataset_in.download_count,
        uploader_id=dataset_in.uploader_id,
    )

    # 2. Handle tags
    tag_objects = []
    for tag_name in dataset_in.tags:
        # Check if tag exists
        tag = db.query(Tag).filter_by(tag_category_name=tag_name).first()
        if not tag:
            # If it doesn't exist, create it
            tag = Tag(tag_category_name=tag_name)
            db.add(tag)
            db.commit()
            db.refresh(tag)
        tag_objects.append(tag)

    # 3. Attach tags to the dataset
    db_dataset.tags = tag_objects

    # 4. Save dataset
    db.add(db_dataset)
    db.commit()
    db.refresh(db_dataset)

    return db_dataset

@router.get("/datasets/{dataset_id}", response_model=DatasetResponse)
def get_dataset(dataset_id: int, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset


@router.put("/datasets/{dataset_id}", response_model=DatasetResponse)
def update_dataset(
    dataset_id: int,
    dataset_in: DatasetCreate,
    db: Session = Depends(get_db),
    user = Depends(permit_action("dataset"))
):
    db_dataset = db.query(Dataset).filter_by(dataset_id=dataset_id).first()
    if not db_dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    # Update fields
    db_dataset.dataset_name = dataset_in.dataset_name
    db_dataset.dataset_description = dataset_in.dataset_description
    db_dataset.downloads_count = dataset_in.downloads_count
    db_dataset.uploader_id = dataset_in.uploader_id

    # Update tags
    tag_objects = []
    for tag_name in dataset_in.tags:
        tag = db.query(Tag).filter_by(tag_category_name=tag_name).first()
        if not tag:
            tag = Tag(tag_category_name=tag_name)
            db.add(tag)
            db.commit()
            db.refresh(tag)
        tag_objects.append(tag)

    db_dataset.tags = tag_objects  # Reassign all tags

    db.commit()
    db.refresh(db_dataset)
    return db_dataset

@router.delete("/datasets/{dataset_id}", status_code=204)
def delete_dataset(dataset_id: int, db: Session = Depends(get_db), user = Depends(permit_action("dataset"))):
    db_dataset = db.query(Dataset).filter_by(dataset_id=dataset_id).first()
    if not db_dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    db.delete(db_dataset)
    db.commit()
    return
