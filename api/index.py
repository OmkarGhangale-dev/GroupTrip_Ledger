"""
api/index.py
------------
Vercel Python Serverless Function entry point.
Uses Mangum as the ASGI-to-WSGI adapter for the @vercel/python runtime.
"""
import sys
import os
import traceback

# Ensure all root-level packages are discoverable at runtime
_FILE_DIR = os.path.dirname(os.path.abspath(__file__))
_ROOT_DIR = os.path.dirname(_FILE_DIR)

for _p in (_ROOT_DIR, _FILE_DIR):
    if _p not in sys.path:
        sys.path.insert(0, _p)

try:
    from app.main import app
    from mangum import Mangum

    # Mangum wraps the FastAPI ASGI app into an AWS Lambda/Vercel-compatible handler
    handler = Mangum(app, lifespan="off")

except Exception as exc:
    err_tb = traceback.format_exc()
    print("FATAL STARTUP ERROR IN api/index.py:\n", err_tb, flush=True)

    # Fallback: return a diagnostic JSON response for every request
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse
    from mangum import Mangum

    _diag_app = FastAPI(title="Error Diagnostic")

    @_diag_app.api_route(
        "/{full_path:path}",
        methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
    )
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
                "files_in_cwd": (
                    os.listdir(os.getcwd())
                    if os.path.exists(os.getcwd())
                    else []
                ),
            },
        )

    handler = Mangum(_diag_app, lifespan="off")
