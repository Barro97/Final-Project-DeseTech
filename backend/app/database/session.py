from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.app.core.config import DATABASE_URL
from sqlalchemy.pool import QueuePool
# from dotenv import load_dotenv
# import os

# load_dotenv()
# DATABASE_URL = os.getenv("DATABASE_URL")

# supabase: Client = create_client(DATABASE_URL, key)

engine = create_engine(
    DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_pre_ping=True,  # Enables connection health checks
    pool_recycle=3600,  # Recycle connections after 1 hour
    poolclass=QueuePool
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

