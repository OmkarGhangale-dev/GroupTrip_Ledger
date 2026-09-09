"""
api/index.py
------------
Vercel Python Serverless Function entry point.
Exposes the FastAPI ASGI application for @vercel/python runtime.
"""
import sys
import os
import traceback

# Ensure all root modules (app, routers, models, services, schemas, utils)
# are discoverable in any serverless execution directory
CWD = os.getcwd()
if CWD not in sys.path:
    sys.path.insert(0, CWD)

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

try:
    from app.main import app  # noqa: E402
    handler = app
except Exception as exc:
    err_tb = traceback.format_exc()
    print("FATAL STARTUP ERROR IN api/index.py:\n", err_tb, flush=True)
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse

    app = FastAPI(title="Error Diagnostic")

    @app.api_route("/{full_path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
    async def debug_error(full_path: str):
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": "FastAPI failed to start in serverless function",
                "detail": str(exc),
                "traceback": err_tb.splitlines(),
                "sys_path": sys.path,
                "cwd": os.getcwd(),
                "files_in_cwd": os.listdir(os.getcwd()) if os.path.exists(os.getcwd()) else [],
            },
        )
    handler = app
