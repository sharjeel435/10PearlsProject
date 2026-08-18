"""Thin deployment entrypoint; the application implementation remains in src.api.app."""
from src.api.app import app

__all__ = ["app"]
