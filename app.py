"""
Local development entry point for the FastAPI server.

This file is NOT used in production — the project deploys as a static
Next.js site on Vercel with no backend server.

Usage (local only):
    uvicorn app_local:app --host 127.0.0.1 --port 8000

Or use the module path directly:
    uvicorn src.api.app:app --host 127.0.0.1 --port 8000
"""
from src.api.app import app  # noqa: F401 — re-exported for uvicorn convenience
