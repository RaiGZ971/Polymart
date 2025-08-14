"""
Favorites-related routes for the Supabase client.
Handles favorite listing operations including toggle, list, and status check.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from supabase_client.schemas import (
    FavoriteRequest, FavoriteResponse, UserFavorite, UserFavoritesResponse
)
from supabase_client.database import favorites as favorites_db, listings as listings_db
from supabase_client.database.favorites import (
    build_favorites_query, build_favorite_listing_detail_query
)
from supabase_client.utils import convert_listing_to_product
from auth.utils import get_current_user
from core.utils import create_standardized_response

router = APIRouter()

@router.post("/favorite-listings", response_model=FavoriteResponse)
async def toggle_favorite_listing(
    favorite_data: FavoriteRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Toggle favorite status for a listing. If already favorited, remove from favorite listings.
    If not favorited, add to favorite listings.
    """
    try:
        # Check if listing exists and user can't favorite their own listing
        listing = await listings_db.get_listing_by_id(current_user["user_id"], favorite_data.listing_id, include_seller_info=False)
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        if listing["seller_id"] == current_user["user_id"]:
            raise HTTPException(status_code=400, detail="You cannot favorite your own listing.")
        
        if listing["status"] != "active":
            raise HTTPException(status_code=400, detail="Cannot favorite inactive listings")

        # Check if already favorited
        is_favorited = await favorites_db.check_favorite_exists(current_user["user_id"], favorite_data.listing_id)

        if is_favorited:
            # Remove from favorites
            await favorites_db.remove_favorite(current_user["user_id"], favorite_data.listing_id)
            return FavoriteResponse(
                success=True,
                message="Listing removed from favorite listings",
                is_favorited=False,
                listing_id=favorite_data.listing_id
            )
        else:
            # Add to favorites
            await favorites_db.add_favorite(current_user["user_id"], favorite_data.listing_id)
            return FavoriteResponse(
                success=True,
                message="Listing added to favorite listings",
                is_favorited=True,
                listing_id=favorite_data.listing_id
            )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error toggling favorite listing: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to toggle favorite listing: {str(e)}")

@router.get("/favorite-listings", response_model=UserFavoritesResponse)
async def get_user_favorite_listings(
    include_listing_details: bool = Query(True, description="Include full listing details in response"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get the current user's favorite listings. Optionally includes full listing details.
    """
    try:
        # Get user's favorites (just the relationships)
        from supabase_client.database.base import get_authenticated_client
        supabase = get_authenticated_client(current_user["user_id"])
        favorites_result = favorites_db.get_user_favorites(supabase, current_user["user_id"], include_listing_details=False)
        
        if not favorites_result["success"]:
            raise HTTPException(status_code=500, detail=favorites_result.get("error", "Failed to fetch favorites"))

        favorites_data = favorites_result["data"]
        if not favorites_data:
            return UserFavoritesResponse(
                favorites=[],
                total_count=0,
                page=1,
                page_size=0
            )

        favorites = []
        for favorite in favorites_data:
            listing_details = None
            
            # If listing details are requested, fetch them separately
            if include_listing_details:
                try:
                    listing_result = await listings_db.get_listing_by_id(
                        current_user["user_id"], 
                        favorite["listing_id"], 
                        include_seller_info=True
                    )
                    if listing_result:
                        listing_details = await convert_listing_to_product(supabase, listing_result, current_user["user_id"])
                except Exception as e:
                    print(f"Error fetching listing details for {favorite['listing_id']}: {e}")
                    # Continue without listing details for this item
            
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
        print(f"Error fetching user favorite listings: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch user favorite listings: {str(e)}")

@router.get("/favorite-listings/check/{listing_id}")
async def check_favorite_listing_status(
    listing_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Check if a specific listing is in the current user's favorite listings.
    """
    try:
        # Check if favorited
        is_favorited = await favorites_db.check_favorite_exists(current_user["user_id"], listing_id)
        
        favorited_at = None
        if is_favorited:
            # Get the favorite details including timestamp
            from supabase_client.database.base import get_authenticated_client
            supabase = get_authenticated_client(current_user["user_id"])
            favorites_result = favorites_db.get_user_favorites(supabase, current_user["user_id"], include_listing_details=False)
            if favorites_result["success"]:
                for favorite in favorites_result["data"]:
                    if favorite["listing_id"] == listing_id:
                        favorited_at = favorite["favorited_at"]
                        break
        
        return create_standardized_response(
            message="Favorite listing status retrieved",
            data={
                "listing_id": listing_id,
                "is_favorited": is_favorited,
                "favorited_at": favorited_at
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error checking favorite listing status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to check favorite listing status: {str(e)}")
