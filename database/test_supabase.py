import asyncio
import os
import asyncpg
from dotenv import load_dotenv

load_dotenv()

async def main():
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        print("ERROR: DATABASE_URL not found in .env")
        return

    url = database_url.replace(
        "postgresql+asyncpg://",
        "postgresql://"
    )

    conn = await asyncpg.connect(url)

    print("SUPABASE CONNECTION: SUCCESS")

    # Check which database and user are connected
    info = await conn.fetchrow("""
        SELECT
            current_database() AS db,
            current_user AS username,
            current_schema() AS schema,
            inet_server_addr() AS server;
    """)

    print("\nCONNECTION DETAILS:")
    print(dict(info))

    # List all tables outside PostgreSQL system schemas
    tables = await conn.fetch("""
        SELECT
            table_schema,
            table_name,
            table_type
        FROM information_schema.tables
        WHERE table_schema NOT IN (
            'pg_catalog',
            'information_schema'
        )
        ORDER BY table_schema, table_name;
    """)

    print("\nALL VISIBLE TABLES:")

    if tables:
        for table in tables:
            print(
                f"- {table['table_schema']}."
                f"{table['table_name']} "
                f"({table['table_type']})"
            )
    else:
        print("No tables visible to this connection.")

    await conn.close()

asyncio.run(main())