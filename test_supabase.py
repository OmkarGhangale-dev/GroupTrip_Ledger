import asyncio
import os
import asyncpg
from dotenv import load_dotenv

load_dotenv()

async def main():
    url = os.getenv("DATABASE_URL").replace(
        "postgresql+asyncpg://",
        "postgresql://"
    )

    conn = await asyncpg.connect(url)

    print("SUPABASE CONNECTION: SUCCESS")

    tables = await conn.fetch("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name;
    """)

    print("\nSUPABASE TABLES:")
    for table in tables:
        print("-", table["table_name"])

    await conn.close()

asyncio.run(main())