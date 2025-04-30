from dotenv import load_dotenv
import os
from pathlib import Path

# Load the .env file from the root of the project
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)
DATABASE_URL = os.getenv("DATABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET")