from fastapi import UploadFile
import os, shutil
import uuid
from urllib.parse import quote
from supabase import create_client
from backend.app.core.config import SUPABASE_URL,SUPABASE_KEY,SUPABASE_STORAGE_BUCKET

print(SUPABASE_URL)
client = create_client(SUPABASE_URL,SUPABASE_KEY)

# Where *this file* is located:
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # backend/features/

# Jump one level up to get `backend/`:
BACKEND_DIR = os.path.dirname(BASE_DIR)               # backend/

# Then point to `backend/storage/uploads`
UPLOAD_DIR = os.path.join(BACKEND_DIR, "storage", "uploads")

def save_file_locally(file: UploadFile) -> str:
    filename = f"{uuid.uuid4()}.{file.filename}" # Create a unique file name
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return file_path

def save_file_to_cloud(file: UploadFile) -> str: #TODO: Implement this function when we want to share files via cloud

  
    # unique path inside the bucket
    unique_name = f"{uuid.uuid4()}/{file.filename}"
    file.file.seek(0)
    file_bytes = file.file.read()

    
    client.storage.from_(SUPABASE_STORAGE_BUCKET).upload(unique_name,file_bytes),{"content-type": file.content_type, "upsert": True},
    # file_path = client.storage.from_(SUPABASE_STORAGE_BUCKET).get_public_url(unique_name)
    # print(file_path)
    size = file.file.tell()            # current pointer == size
    return unique_name, size

def save_file(file: UploadFile) -> str:
    # if not os.path.exists(UPLOAD_DIR):
    #     os.makedirs(UPLOAD_DIR)
    return save_file_to_cloud(file)

def delete_file_from_storage(file_key: str):
    # Delete the file
    result = client.storage.from_(SUPABASE_STORAGE_BUCKET).remove([file_key])
    if result[0].get("error"):
        raise Exception(f"Failed to delete file from storage: {result[0].get("error")['message']}")
    return True

def list_all_files():
    result = client.storage.from_(SUPABASE_STORAGE_BUCKET).list()
    for file in result:
        print("Stored file:", file.get("name"))
