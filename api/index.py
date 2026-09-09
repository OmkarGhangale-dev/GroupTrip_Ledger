"""
api/index.py
Vercel Serverless Function entrypoint.
Exposes the FastAPI application instance `app`.
"""
import sys
import os

# Ensure the project root is on sys.path so that
# `app`, `routers`, `models`, `services`, `schemas`, `utils`, `database`
# are all importable as top-level packages.
_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

# Also add /var/task which is where Vercel deploys the files
_TASK = "/var/task"
if _TASK not in sys.path:
    sys.path.insert(0, _TASK)

from app.main import app  # noqa: E402
