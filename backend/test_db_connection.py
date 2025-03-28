from sqlalchemy import create_engine, text

# Replace with your actual Supabase DB URL
# DATABASE_URL = "postgresql://postgres:DeserTech12%40@db.lcoduucmlcawbschlsaf.supabase.co:5432/postgres"


# engine = create_engine(DATABASE_URL)

# try:
#     with engine.connect() as connection:
#         result = connection.execute(text("SELECT 1"))
#         print("✅ Successfully connected to Supabase!")
#         print("Result:", result.scalar())
# except Exception as e:
#     print("❌ Failed to connect to Supabase:")
#     print(e)


from sqlalchemy import create_engine, text

# Replace with your actual Supabase DB URL
DATABASE_URL = "postgresql://postgres:DeserTech12%40@db.lcoduucmlcawbschlsaf.supabase.co:5432/postgres"

engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as connection:
        result = connection.execute(text("""
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_schema NOT IN ('information_schema', 'pg_catalog') 
              AND table_type = 'BASE TABLE';
        """))
        
        print("✅ Successfully connected to Supabase!")
        print("📋 Tables in your database:")
        for row in result:
            print(f"- {row.table_schema}.{row.table_name}")
except Exception as e:
    print("❌ Failed to connect to Supabase:")
    print(e)

