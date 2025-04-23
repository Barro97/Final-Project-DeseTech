from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
# from supabase import create_client, Client

DATABASE_URL = "postgresql://postgres:DeserTech12%40@db.lcoduucmlcawbschlsaf.supabase.co:5432/postgres"

key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb2R1dWNtbGNhd2JzY2hsc2FmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzE2MzkzMiwiZXhwIjoyMDU4NzM5OTMyfQ.kD-WEr15AHkwZK-zKhWkZpQSQowUjlaoAfb3l_2w6EQ"


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

