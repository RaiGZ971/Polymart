"""
Utility functions for Supabase client operations.
Contains reusable logic for validation, database operations, and data processing.
"""

from typing import Optional, List, Dict, Any, Tuple
from fastapi import HTTPException
from supabase_client.auth_client import get_authenticated_supabase_client
from supabase_client.schemas import ListingImage, ProductListing
from core.config import ensure_proper_image_urls

VALID_CATEGORIES = {
    "Academic_Essentials",
    "Tech_Gadgets", 
    "Creative_Works",
    "Fashion",
    "Services",
    "Other"
}

VALID_STATUSES = {"active", "inactive", "sold_out", "archived"}

# Validation Functions
def validate_category(category: Optional[str]) -> None:
    """Validate product category against allowed values."""
    if category and category not in VALID_CATEGORIES:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid category. Valid categories are: {', '.join(VALID_CATEGORIES)}"
        )

def validate_status(status: Optional[str]) -> None:
    """Validate listing status against allowed values."""
    if status and status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid status. Valid statuses are: {', '.join(VALID_STATUSES)}"
        )

def validate_price_range(price_min: Optional[float], price_max: Optional[float]) -> None:
    """Validate price range constraints."""
    if price_min is None and price_max is not None:
        raise HTTPException(
            status_code=400,
            detail="Cannot set maximum price without minimum price. Use price_min for single price items."
        )
    
    if (price_min is not None and 
        price_max is not None and 
        price_max < price_min):
        raise HTTPException(
            status_code=400,
            detail="Maximum price must be greater than or equal to minimum price"
        )

# Database Helper Functions
def get_supabase_client(user_id: int):
    """Get authenticated Supabase client with error handling."""
    supabase = get_authenticated_supabase_client(user_id)
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection failed")
    return supabase

def calculate_pagination_offset(page: int, page_size: int) -> int:
    """Calculate pagination offset."""
    return (page - 1) * page_size

# Image Processing Functions
async def get_images_for_listing(supabase, listing_id: int) -> List[ListingImage]:
    """
    Fetch and process images for a specific listing.
    Returns a list of ListingImage objects with proper URLs.
    """
    images_result = supabase.table("listing_images").select("""
        image_id,
        image_url,
        is_primary
    """).eq("listing_id", listing_id).order("is_primary", desc=True).execute()
    
    images = []
    if images_result.data:
        # Extract image URLs and ensure they're proper URLs
        image_urls = [img["image_url"] for img in images_result.data]
        proper_urls = ensure_proper_image_urls(image_urls, is_private=False)
        
        images = [
            ListingImage(
                image_id=img["image_id"],
                image_url=proper_url,
                is_primary=img["is_primary"]
            )
            for img, proper_url in zip(images_result.data, proper_urls)
        ]
    
    return images

# Listing Conversion Functions
async def convert_listing_to_product(supabase, listing: Dict[str, Any]) -> ProductListing:
    """
    Convert a database listing record to a ProductListing object.
    Includes fetching and processing associated images.
    """
    # Get images for this listing
    images = await get_images_for_listing(supabase, listing["listing_id"])
    
    # Extract seller username from join or use seller_id as fallback
    seller_username = str(listing["seller_id"])
    if "user_profile" in listing and listing["user_profile"]:
        seller_username = listing["user_profile"]["username"]
    
    return ProductListing(
        listing_id=listing["listing_id"],
        seller_id=listing["seller_id"],
        seller_username=seller_username,
        name=listing["name"],
        description=listing["description"],
        category=listing["category"],
        tags=listing["tags"],
        price_min=listing["price_min"],
        price_max=listing["price_max"],
        total_stock=listing["total_stock"],
        sold_count=listing["sold_count"],
        status=listing["status"],
        created_at=listing["created_at"],
        updated_at=listing["updated_at"],
        seller_meetup_locations=listing["seller_meetup_locations"],
        images=images
    )

async def convert_listings_to_products(supabase, listings: List[Dict[str, Any]]) -> List[ProductListing]:
    """
    Convert multiple database listing records to ProductListing objects.
    """
    products = []
    for listing in listings:
        product = await convert_listing_to_product(supabase, listing)
        products.append(product)
    return products

# Query Building Functions
def apply_listing_filters(query, category: Optional[str] = None, search: Optional[str] = None, 
                         min_price: Optional[float] = None, max_price: Optional[float] = None,
                         status: Optional[str] = None):
    """
    Apply common filters to a listings query.
    """
    if category:
        query = query.eq("category", category)
    
    if status:
        query = query.eq("status", status)
    
    if search:
        # Search in name and description
        query = query.or_(f"name.ilike.%{search}%,description.ilike.%{search}%")
    
    if min_price is not None:
        query = query.gte("price_min", min_price)
    
    if max_price is not None:
        query = query.lte("price_max", max_price)
    
    return query

def apply_pagination(query, page: int, page_size: int):
    """
    Apply pagination to a query.
    """
    offset = calculate_pagination_offset(page, page_size)
    return query.order("created_at", desc=True).range(offset, offset + page_size - 1)

def get_total_count(query) -> int:
    """
    Get total count of records for pagination.
    """
    count_result = query.execute()
    return len(count_result.data) if count_result.data else 0

# Listing Query Functions
def build_public_listings_query(supabase, user_id: int):
    """
    Build base query for public listings (excluding current user's listings).
    """
    return supabase.table("listings").select(
        "listing_id,seller_id,name,description,category,tags,price_min,price_max,total_stock,sold_count,status,created_at,updated_at,seller_meetup_locations"
    ).neq("seller_id", user_id).not_.is_("seller_id", "null").eq("status", "active")

def build_user_listings_query(supabase, user_id: int):
    """
    Build base query for user's own listings.
    """
    return supabase.table("listings").select(
        "listing_id,seller_id,name,description,category,tags,price_min,price_max,total_stock,sold_count,status,created_at,updated_at,seller_meetup_locations"
    ).eq("seller_id", user_id)

def build_listing_detail_query(supabase, listing_id: int):
    """
    Build query for fetching a single listing with seller username.
    """
    return supabase.table("listings").select("""
        listing_id,
        seller_id,
        name,
        description,
        category,
        tags,
        price_min,
        price_max,
        total_stock,
        sold_count,
        status,
        created_at,
        updated_at,
        seller_meetup_locations,
        user_profile!inner(username)
    """).eq("listing_id", listing_id).eq("status", "active").not_.is_("seller_id", "null")

# Favorites Helper Functions
async def check_listing_exists_and_active(supabase, listing_id: int) -> Dict[str, Any]:
    """
    Check if a listing exists and is active. Returns the listing data.
    """
    listing_result = supabase.table("listings").select("listing_id,name,status").eq("listing_id", listing_id).execute()
    
    if not listing_result.data or len(listing_result.data) == 0:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    listing = listing_result.data[0]
    if listing["status"] != "active":
        raise HTTPException(status_code=400, detail="Cannot favorite inactive listings")
    
    return listing

async def check_favorite_exists(supabase, user_id: int, listing_id: int) -> bool:
    """
    Check if a favorite already exists for the user and listing.
    """
    existing_favorite = supabase.table("user_favorites").select("user_id,listing_id").eq("user_id", user_id).eq("listing_id", listing_id).execute()
    return existing_favorite.data and len(existing_favorite.data) > 0

def build_favorites_query(supabase, user_id: int):
    """
    Build base query for user favorites.
    """
    return supabase.table("user_favorites").select(
        "listing_id,favorited_at"
    ).eq("user_id", user_id)

def build_favorite_listing_detail_query(supabase, listing_id: int):
    """
    Build query for fetching listing details for favorites.
    """
    return supabase.table("listings").select("""
        listing_id,
        seller_id,
        name,
        description,
        category,
        tags,
        price_min,
        price_max,
        total_stock,
        sold_count,
        status,
        created_at,
        updated_at,
        seller_meetup_locations,
        user_profile!inner(username)
    """).eq("listing_id", listing_id).eq("status", "active")

# Error Handling Wrapper
def handle_database_errors(func):
    """
    Decorator to handle common database errors.
    """
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except HTTPException:
            raise
        except Exception as e:
            operation_name = func.__name__.replace('_', ' ')
            print(f"Error in {operation_name}: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to {operation_name}: {str(e)}")
    return wrapper
