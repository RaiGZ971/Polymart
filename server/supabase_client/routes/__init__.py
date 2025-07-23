"""
Supabase client routes package.
Contains organized route modules for different functionalities.
"""

from fastapi import APIRouter
from .listings import router as listings_router
from .favorites import router as favorites_router

# Create main router that combines all sub-routers
router = APIRouter()

# Include sub-routers
router.include_router(listings_router, prefix="", tags=["listings"])
router.include_router(favorites_router, prefix="", tags=["favorites"])
