"""
Favorites-related database operations.
Handles user favorite listings management.
"""

from typing import Dict, Any, List, Optional
from fastapi import HTTPException
from .base import get_authenticated_client, handle_database_error, validate_record_exists


async def check_favorite_exists(user_id: int, listing_id: int) -> bool:
    """
    Check if a listing is already in user's favorites.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        existing_favorite = supabase.table("user_favorites").select(
            "user_id"
        ).eq("user_id", user_id).eq("listing_id", listing_id).execute()
        
        return bool(existing_favorite.data and len(existing_favorite.data) > 0)
    except Exception as e:
        handle_database_error("check favorite exists", e)


async def add_favorite(user_id: int, listing_id: int) -> Dict[str, Any]:
    """
    Add a listing to user's favorites.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        # Check if already favorited
        if await check_favorite_exists(user_id, listing_id):
            raise HTTPException(status_code=400, detail="Listing is already in favorites")
        
        favorite_data = {
            "user_id": user_id,
            "listing_id": listing_id
        }
        
        result = supabase.table("user_favorites").insert(favorite_data).execute()
        
        validate_record_exists(result.data, "Failed to add to favorites")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        handle_database_error("add favorite", e)


async def remove_favorite(user_id: int, listing_id: int) -> bool:
    """
    Remove a listing from user's favorites.
    Returns True if removed, False if wasn't favorited.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        # Check if favorited
        if not await check_favorite_exists(user_id, listing_id):
            return False
        
        result = supabase.table("user_favorites").delete().eq("user_id", user_id).eq("listing_id", listing_id).execute()
        
        return True
    except Exception as e:
        handle_database_error("remove favorite", e)


async def get_user_favorites(user_id: int, include_listing_details: bool = True) -> List[Dict[str, Any]]:
    """
    Get user's favorite listings.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        if include_listing_details:
            # Join with listings table to get full details
            query = supabase.table("user_favorites").select("""
                listing_id,
                favorited_at,
                listings:listing_id (
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
                )
            """).eq("user_id", user_id).order("favorited_at", desc=True)
        else:
            # Only get basic favorite info
            query = supabase.table("user_favorites").select(
                "listing_id,favorited_at"
            ).eq("user_id", user_id).order("favorited_at", desc=True)
        
        result = query.execute()
        return result.data if result.data else []
    except Exception as e:
        handle_database_error("get user favorites", e)


async def get_favorite_listing_details(user_id: int, listing_id: int) -> Optional[Dict[str, Any]]:
    """
    Get detailed listing information for a favorited item.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        # First verify it's in favorites
        if not await check_favorite_exists(user_id, listing_id):
            return None
        
        # Get listing details
        listing_result = supabase.table("listings").select("""
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
        """).eq("listing_id", listing_id).execute()
        
        if listing_result.data and len(listing_result.data) > 0:
            return listing_result.data[0]
        return None
    except Exception as e:
        handle_database_error("get favorite listing details", e)


async def get_favorites_count(user_id: int) -> int:
    """
    Get the total count of user's favorite listings.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        result = supabase.table("user_favorites").select("listing_id").eq("user_id", user_id).execute()
        
        return len(result.data) if result.data else 0
    except Exception as e:
        handle_database_error("get favorites count", e)


async def clear_user_favorites(user_id: int) -> int:
    """
    Remove all favorites for a user.
    Returns the number of favorites removed.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        # Get count before deletion
        count = await get_favorites_count(user_id)
        
        # Delete all favorites
        supabase.table("user_favorites").delete().eq("user_id", user_id).execute()
        
        return count
    except Exception as e:
        handle_database_error("clear user favorites", e)


# Query Builder Functions
def build_favorites_query(supabase, user_id: int):
    """Build base query for user favorites."""
    return supabase.table("user_favorites").select(
        "listing_id,favorited_at"
    ).eq("user_id", user_id)


def build_favorite_listing_detail_query(supabase, listing_id: int):
    """Build query for fetching listing details for favorites."""
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
        transaction_methods,
        payment_methods,
        user_profile!inner(username)
    """).eq("listing_id", listing_id).eq("status", "active")
