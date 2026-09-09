"""
api/index.py
------------
Vercel Python Serverless Function entry point.
Wraps the FastAPI ASGI application with Mangum so Vercel can invoke it.
"""
import sys
import os

# Ensure project root is in Python path so that `app`, `routers`,
# `models`, `services`, `schemas`, and `utils` are importable.
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from mangum import Mangum  # noqa: E402
from app.main import app  # noqa: E402

# Vercel invokes the object named `handler`
handler = Mangum(app, lifespan="off")
