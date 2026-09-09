import asyncio
import ssl
import asyncpg

import os
import sys

NEON_DSN = os.getenv("NEON_DATABASE_URL") or os.getenv("DATABASE_URL") or (sys.argv[1] if len(sys.argv) > 1 else "")

async def migrate():
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    conn = await asyncpg.connect(NEON_DSN, ssl=ctx)
    try:
        with open("database/schema.sql", "r", encoding="utf-8") as f:
            sql = f.read()
        
        print("Executing schema.sql on Neon...")
        await conn.execute(sql)
        print("schema.sql executed successfully!")
        
        tables = await conn.fetch("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'grouptrip'
            ORDER BY table_name;
        """)
        print("Tables in grouptrip schema:")
        for t in tables:
            print(" -", t["table_name"])
            
        views = await conn.fetch("""
            SELECT table_name 
            FROM information_schema.views 
            WHERE table_schema = 'grouptrip'
            ORDER BY table_name;
        """)
        print("Views in grouptrip schema:")
        for v in views:
            print(" -", v["table_name"])
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(migrate())
