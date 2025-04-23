from fastapi import UploadFile
import os, shutil
import uuid
from supabase import create_client, Client


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

    SUPABASE_URL = "https://lcoduucmlcawbschlsaf.supabase.co"

    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb2R1dWNtbGNhd2JzY2hsc2FmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzE2MzkzMiwiZXhwIjoyMDU4NzM5OTMyfQ.kD-WEr15AHkwZK-zKhWkZpQSQowUjlaoAfb3l_2w6EQ"

    bucket = 'files'
    # unique path inside the bucket
    unique_name = f"{uuid.uuid4()}/{file.filename}"
    file.file.seek(0)
    file_bytes = file.file.read()

    client = create_client(SUPABASE_URL,key)
    client.storage.from_(bucket).upload(unique_name,file_bytes),{"content-type": file.content_type, "upsert": True},
    file_path = client.storage.from_(bucket).get_public_url(unique_name)

    size = file.file.tell()            # current pointer == size
    return file_path, size

def save_file(file: UploadFile) -> str:
    # if not os.path.exists(UPLOAD_DIR):
    #     os.makedirs(UPLOAD_DIR)
    return save_file_to_cloud(file)

