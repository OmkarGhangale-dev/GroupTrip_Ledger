"""
api/index.py
------------
Vercel Python Serverless Function entry point.
Exposes the FastAPI ASGI application for @vercel/python runtime.
"""
import sys
import os

# Ensure project root is in Python path so that `app`, `routers`,
# `models`, `services`, `schemas`, and `utils` are importable.
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from app.main import app  # noqa: E402

# Vercel @vercel/python native ASGI expects `app`, but we also assign `handler = app` for compatibility
handler = app
