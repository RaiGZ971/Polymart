"""
Main routes module for Supabase client.
Re-exports the router from the routes package for backward compatibility.
"""

from .routes import router

__all__ = ["router"]