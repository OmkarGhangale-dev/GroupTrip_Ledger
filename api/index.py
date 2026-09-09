"""
api/index.py
Vercel Python Serverless Function entry point.
Exposes the FastAPI `app` instance for Vercel's native ASGI runtime.
"""
import sys
import os
import traceback

# Ensure the project root and api directories are in sys.path
_FILE_DIR = os.path.dirname(os.path.abspath(__file__))
_ROOT_DIR = os.path.dirname(_FILE_DIR)

for _p in (_ROOT_DIR, _FILE_DIR):
    if _p not in sys.path:
        sys.path.insert(0, _p)

try:
    from app.main import app
except Exception as e:
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse

    app = FastAPI(title="Startup Diagnostic")
    _err_msg = str(e)
    _err_tb = traceback.format_exc()

    @app.api_route(
        "/{full_path:path}",
        methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
    )
    async def fallback_route(full_path: str = ""):
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": "FastAPI failed to start on Vercel",
                "error": _err_msg,
                "traceback": _err_tb.splitlines(),
                "cwd": os.getcwd(),
                "files_in_cwd": (
                    os.listdir(os.getcwd()) if os.path.exists(os.getcwd()) else []
                ),
                "sys_path": sys.path,
            },
        )
