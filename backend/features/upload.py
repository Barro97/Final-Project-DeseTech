from fastapi import UploadFile
import os, shutil
import uuid

# Where *this file* is located:
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # backend/features/

# Jump one level up to get `backend/`:
BACKEND_DIR = os.path.dirname(BASE_DIR)               # backend/

# Then point to `backend/storage/uploads`
UPLOAD_DIR = os.path.join(BACKEND_DIR, "storage", "uploads")

def save_file_locally(file: UploadFile) -> str:
    filename = f"{uuid.uuid4()}.{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return file_path

def save_file_to_cloud(file: UploadFile) -> str: #TODO: Implement this function when we want to share files via cloud
    return None

def save_file(file: UploadFile) -> str:
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)
    return save_file_locally(file)

