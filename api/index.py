"""
api/index.py
Diagnostic serverless function using purely the standard library (no external dependencies required).
This allows us to inspect the Python runtime, verify pip package installations, and pinpoint any import failures.
"""
from http.server import BaseHTTPRequestHandler
import json
import sys
import os
import traceback


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # 1. Test importing FastAPI
        fastapi_ver = None
        fastapi_err = None
        try:
            import fastapi
            fastapi_ver = fastapi.__version__
        except Exception as e:
            fastapi_err = f"{type(e).__name__}: {str(e)}"

        # 2. Test importing app.main
        app_ok = False
        app_err = None
        app_tb = None
        try:
            _file_dir = os.path.dirname(os.path.abspath(__file__))
            _root_dir = os.path.dirname(_file_dir)
            for _p in (_root_dir, _file_dir):
                if _p not in sys.path:
                    sys.path.insert(0, _p)

            from app.main import app
            app_ok = True
        except Exception as e:
            app_err = f"{type(e).__name__}: {str(e)}"
            app_tb = traceback.format_exc().splitlines()

        # 3. Check environment
        env_summary = {
            "DATABASE_URL_SET": bool(os.environ.get("DATABASE_URL")),
            "SECRET_KEY_SET": bool(os.environ.get("SECRET_KEY")),
            "ALLOWED_ORIGINS": os.environ.get("ALLOWED_ORIGINS", "*"),
        }

        body = json.dumps(
            {
                "status": "online",
                "python_version": sys.version,
                "fastapi_installed": bool(fastapi_ver),
                "fastapi_version": fastapi_ver,
                "fastapi_error": fastapi_err,
                "app_import_ok": app_ok,
                "app_import_error": app_err,
                "app_import_traceback": app_tb,
                "env_summary": env_summary,
                "cwd": os.getcwd(),
                "cwd_files": os.listdir(os.getcwd()) if os.path.exists(os.getcwd()) else [],
                "sys_path": sys.path,
            },
            indent=2,
        )

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body.encode("utf-8"))

    def do_POST(self):
        self.do_GET()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.end_headers()
