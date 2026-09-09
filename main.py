"""
main.py
Root entrypoint for Vercel and ASGI runners.
Exposes the FastAPI application instance `app`.
"""
import sys
import os

_ROOT = os.path.dirname(os.path.abspath(__file__))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from app.main import app
