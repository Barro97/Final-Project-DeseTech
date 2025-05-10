from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.app.core.config import DATABASE_URL
# from dotenv import load_dotenv
# import os

# load_dotenv()
# DATABASE_URL = os.getenv("DATABASE_URL")

# supabase: Client = create_client(DATABASE_URL, key)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

