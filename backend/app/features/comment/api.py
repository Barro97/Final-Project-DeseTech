# this is a new api call for comments - double check

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models import Comment as CommentModel, Dataset, User
from backend.app.schemas import CommentCreate, Comment as CommentResponse

router = APIRouter()

# Add a comment
@router.post("/comments", response_model=CommentResponse)
def create_comment(comment_in: CommentCreate, db: Session = Depends(get_db)):
    # Optional: check if dataset and user exist
    dataset = db.query(Dataset).filter_by(dataset_id=comment_in.dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    user = db.query(User).filter_by(user_id=comment_in.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db_comment = CommentModel(
        comment_text=comment_in.comment_text,
        user_id=comment_in.user_id,
        dataset_id=comment_in.dataset_id,
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment

# Get all comments for a dataset
@router.get("/datasets/{dataset_id}/comments", response_model=list[CommentResponse])
def get_dataset_comments(dataset_id: int, db: Session = Depends(get_db)):
    comments = db.query(CommentModel).filter_by(dataset_id=dataset_id).order_by(CommentModel.comment_dt.desc()).all()
    return comments

# Delete a comment
@router.delete("/comments/{comment_id}", status_code=204)
def delete_comment(comment_id: int, db: Session = Depends(get_db)):
    comment = db.query(CommentModel).filter_by(comment_id=comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    db.delete(comment)
    db.commit()
    return
