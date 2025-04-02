from fastapi import UploadFile, File
import os, shutil
import uuid

UPLOAD_DIR = "backend/storage/uploads"

def save_file_locally(file: UploadFile) -> str:
    filename = f"{uuid.uuid4()}.{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return file_path

def save_file_to_s3(file: UploadFile) -> str:
    return None

def save_file(file: UploadFile) -> str:
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)
    return save_file_locally(file)

