"""
Supabase client routes package.
Contains organized route modules for different functionalities.
"""

from fastapi import APIRouter
from .listings import router as listings_router
from .favorites import router as favorites_router
from .orders import router as orders_router

# Create main router that combines all sub-routers
router = APIRouter()

# Include sub-routers
router.include_router(listings_router)
router.include_router(favorites_router)
router.include_router(orders_router)
