"""
Favorites-related routes for the Supabase client.
Handles favorite listing operations including toggle, list, and status check.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from supabase_client.schemas import (
    FavoriteRequest, FavoriteResponse, UserFavorite, UserFavoritesResponse
)
from supabase_client.utils import (
    get_supabase_client, check_listing_exists_and_active, check_favorite_exists,
    build_favorites_query, build_favorite_listing_detail_query, convert_listing_to_product,
    get_total_count
)
from auth.utils import get_current_user
from core.utils import create_standardized_response

router = APIRouter()

@router.post("/favorites", response_model=FavoriteResponse)
async def toggle_favorite(
    favorite_data: FavoriteRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Toggle favorite status for a listing. If already favorited, remove from favorites.
    If not favorited, add to favorites.
    """
    try:
        # Get authenticated client
        supabase = get_supabase_client(current_user["user_id"])

        # Fetch listing details to get seller_id
        listing_query = supabase.table("listings").select("listing_id,seller_id").eq("listing_id", favorite_data.listing_id).single()
        listing_result = listing_query.execute()
        if not listing_result.data or "seller_id" not in listing_result.data:
            raise HTTPException(status_code=404, detail="Listing not found")
        seller_id = listing_result.data["seller_id"]
        if str(seller_id) == str(current_user["user_id"]):
            raise HTTPException(status_code=400, detail="You cannot favorite your own listing.")

        # Check if listing exists and is active
        await check_listing_exists_and_active(supabase, favorite_data.listing_id)

        # Check if already favorited
        is_favorited = await check_favorite_exists(supabase, current_user["user_id"], favorite_data.listing_id)

        if is_favorited:
            # Remove from favorites
            supabase.table("user_favorites").delete().eq("user_id", current_user["user_id"]).eq("listing_id", favorite_data.listing_id).execute()
            return FavoriteResponse(
                success=True,
                message="Listing removed from favorites",
                is_favorited=False,
                listing_id=favorite_data.listing_id
            )
        else:
            # Add to favorites
            insert_result = supabase.table("user_favorites").insert({
                "user_id": current_user["user_id"],
                "listing_id": favorite_data.listing_id
            }).execute()
            if not insert_result.data or len(insert_result.data) == 0:
                raise HTTPException(status_code=500, detail="Failed to add to favorites")
            return FavoriteResponse(
                success=True,
                message="Listing added to favorites",
                is_favorited=True,
                listing_id=favorite_data.listing_id
            )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error toggling favorite: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to toggle favorite: {str(e)}")

@router.get("/favorites", response_model=UserFavoritesResponse)
async def get_user_favorites(
    include_listing_details: bool = Query(True, description="Include full listing details in response"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get the current user's favorite listings. Optionally includes full listing details.
    """
    try:
        # Get authenticated client
        supabase = get_supabase_client(current_user["user_id"])

        # Build base query for favorites (no pagination)
        query = build_favorites_query(supabase, current_user["user_id"])
        query = query.order("favorited_at", desc=True)

        # Execute query
        result = query.execute()

        if not result.data:
            return UserFavoritesResponse(
                favorites=[],
                total_count=0,
                page=1,
                page_size=0
            )

        favorites = []
        for favorite in result.data:
            listing_details = None
            # If requested, fetch full listing details
            if include_listing_details:
                listing_query = build_favorite_listing_detail_query(supabase, favorite["listing_id"])
                listing_result = listing_query.execute()
                if listing_result.data and len(listing_result.data) > 0:
                    listing = listing_result.data[0]
                    listing_details = await convert_listing_to_product(supabase, listing)
            favorites.append(UserFavorite(
                listing_id=favorite["listing_id"],
                favorited_at=favorite["favorited_at"],
                listing=listing_details
            ))

        return UserFavoritesResponse(
            favorites=favorites,
            total_count=len(favorites),
            page=1,
            page_size=len(favorites)
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching user favorites: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch user favorites: {str(e)}")

@router.get("/favorites/check/{listing_id}")
async def check_favorite_status(
    listing_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Check if a specific listing is favorited by the current user.
    """
    try:
        # Get authenticated client
        supabase = get_supabase_client(current_user["user_id"])
        
        # Check if favorited
        is_favorited = await check_favorite_exists(supabase, current_user["user_id"], listing_id)
        
        favorited_at = None
        if is_favorited:
            # Get the favorite timestamp
            favorite_result = supabase.table("user_favorites").select("favorited_at").eq("user_id", current_user["user_id"]).eq("listing_id", listing_id).execute()
            if favorite_result.data and len(favorite_result.data) > 0:
                favorited_at = favorite_result.data[0]["favorited_at"]
        
        return create_standardized_response(
            message="Favorite status retrieved",
            data={
                "listing_id": listing_id,
                "is_favorited": is_favorited,
                "favorited_at": favorited_at
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error checking favorite status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to check favorite status: {str(e)}")
