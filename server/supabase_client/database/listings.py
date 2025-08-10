"""
Listing-related database operations.
Handles product listing CRUD operations and queries.
"""

from typing import Dict, Any, List, Optional
from fastapi import HTTPException
from uuid import UUID
from .base import get_authenticated_client, handle_database_error, validate_record_exists, calculate_pagination_offset


async def create_listing(user_id: UUID, listing_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a new product listing.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        # Set seller_id and default values
        listing_data["seller_id"] = user_id
        if "status" not in listing_data:
            listing_data["status"] = "active"
        if "sold_count" not in listing_data:
            listing_data["sold_count"] = 0
        
        result = supabase.table("listings").insert(listing_data).execute()
        
        validate_record_exists(result.data, "Failed to create listing")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        handle_database_error("create listing", e)


async def get_listing_by_id(user_id: UUID, listing_id: int, include_seller_info: bool = True) -> Optional[Dict[str, Any]]:
    """
    Get a specific listing by ID.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        # Simplified select without JOIN - let converter handle user profile fetching
        select_fields = """
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
            payment_methods
        """
        
        result = supabase.table("listings").select(select_fields).eq("listing_id", listing_id).execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0]
        return None
    except Exception as e:
        handle_database_error("get listing by ID", e)


async def get_public_listings(user_id: Optional[UUID] = None, page: int = 1, page_size: int = 20, 
                             category: Optional[str] = None, search: Optional[str] = None,
                             min_price: Optional[float] = None, max_price: Optional[float] = None,
                             sort_by: Optional[str] = "newest") -> Dict[str, Any]:
    """
    Get public listings (excluding user's own listings).
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        # Build base query excluding user's own listings - simplified without JOIN
        query = supabase.table("listings").select("""
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
            payment_methods
        """).eq("status", "active").neq("seller_id", user_id)
        
        # Apply filters
        if category:
            query = query.eq("category", category)
        
        if search:
            # Search in name field only to avoid or_ method complications
            search_pattern = f"%{search}%"
            query = query.ilike("name", search_pattern)
        
        if min_price is not None:
            query = query.gte("price_min", min_price)
        
        if max_price is not None:
            query = query.lte("price_max", max_price)
        
        # Get total count
        count_result = query.execute()
        total_count = len(count_result.data) if count_result.data else 0
        
        # Apply sorting
        if sort_by == "price_low_high":
            query = query.order("price_min", desc=False)
        elif sort_by == "price_high_low":
            query = query.order("price_min", desc=True)
        elif sort_by == "name_a_z":
            query = query.order("name", desc=False)
        elif sort_by == "name_z_a":
            query = query.order("name", desc=True)
        elif sort_by == "date_oldest":
            query = query.order("created_at", desc=False)
        else:  # Default to newest (date_newest)
            query = query.order("created_at", desc=True)
        
        # Apply pagination
        offset = calculate_pagination_offset(page, page_size)
        query = query.range(offset, offset + page_size - 1)
        
        result = query.execute()
        
        return {
            "listings": result.data if result.data else [],
            "total_count": total_count
        }
    except Exception as e:
        handle_database_error("get public listings", e)


async def get_user_listings(user_id: UUID, category: Optional[str] = None, 
                           search: Optional[str] = None, status: Optional[str] = None,
                           sort_by: Optional[str] = "newest") -> List[Dict[str, Any]]:
    """
    Get user's own listings.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        # Simplified query without JOIN - let converter handle user profile fetching
        query = supabase.table("listings").select("""
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
            payment_methods
        """).eq("seller_id", user_id)
        
        # Apply filters
        if category:
            query = query.eq("category", category)
        
        if search:
            # Search in name field only (avoiding or_ method issues)
            search_pattern = f"%{search}%"
            query = query.ilike("name", search_pattern)
        
        if status:
            query = query.eq("status", status)
        
        # Apply sorting
        if sort_by == "price_low_high":
            query = query.order("price_min", desc=False)
        elif sort_by == "price_high_low":
            query = query.order("price_min", desc=True)
        elif sort_by == "name_a_z":
            query = query.order("name", desc=False)
        elif sort_by == "name_z_a":
            query = query.order("name", desc=True)
        elif sort_by == "date_oldest":
            query = query.order("created_at", desc=False)
        else:  # Default to newest (date_newest)
            query = query.order("created_at", desc=True)
        
        result = query.execute()
        
        return result.data if result.data else []
    except Exception as e:
        handle_database_error("get user listings", e)


async def update_listing_status(user_id: UUID, listing_id: int, new_status: str) -> Dict[str, Any]:
    """
    Update listing status. Only the owner can update.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        # First check if listing exists and belongs to user
        listing_check = supabase.table("listings").select("listing_id,seller_id,name,status").eq("listing_id", listing_id).execute()
        
        validate_record_exists(listing_check.data, "Listing not found")
        listing = listing_check.data[0]
        
        # Check ownership
        if listing["seller_id"] != user_id:
            raise HTTPException(status_code=403, detail="You can only update your own listings")
        
        # Update the status
        result = supabase.table("listings").update({
            "status": new_status,
            "updated_at": "now()"
        }).eq("listing_id", listing_id).eq("seller_id", user_id).execute()
        
        validate_record_exists(result.data, "Failed to update listing status")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        handle_database_error("update listing status", e)


async def update_listing(user_id: UUID, listing_id: int, update_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update listing information. Only the owner can update.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        # First check ownership
        listing = await get_listing_by_id(user_id, listing_id, include_seller_info=False)
        validate_record_exists(listing, "Listing not found")
        
        if listing["seller_id"] != user_id:
            raise HTTPException(status_code=403, detail="You can only update your own listings")
        
        # Add updated timestamp
        update_data["updated_at"] = "now()"
        
        result = supabase.table("listings").update(update_data).eq("listing_id", listing_id).execute()
        
        validate_record_exists(result.data, "Failed to update listing")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        handle_database_error("update listing", e)


async def delete_listing(user_id: UUID, listing_id: int) -> bool:
    """
    Delete a listing. Only the owner can delete.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        # First check ownership
        listing = await get_listing_by_id(user_id, listing_id, include_seller_info=False)
        validate_record_exists(listing, "Listing not found")
        
        if listing["seller_id"] != user_id:
            raise HTTPException(status_code=403, detail="You can only delete your own listings")
        
        # Delete the listing
        result = supabase.table("listings").delete().eq("listing_id", listing_id).eq("seller_id", user_id).execute()
        
        return True
    except HTTPException:
        raise
    except Exception as e:
        handle_database_error("delete listing", e)


async def get_listing_meetup_times(user_id: UUID, listing_id: int) -> List[Dict[str, Any]]:
    """
    Get meetup time slots for a listing.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        result = supabase.table("listing_meetup_time_details").select("*").eq("listing_id", listing_id).execute()
        
        return result.data if result.data else []
    except Exception as e:
        handle_database_error("get listing meetup times", e)


async def add_listing_meetup_times(user_id: UUID, listing_id: int, time_slots: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Add meetup time slots to a listing.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        # First verify ownership
        listing = await get_listing_by_id(user_id, listing_id, include_seller_info=False)
        validate_record_exists(listing, "Listing not found")
        
        if listing["seller_id"] != user_id:
            raise HTTPException(status_code=403, detail="You can only modify your own listings")
        
        # Add listing_id to each time slot
        for slot in time_slots:
            slot["listing_id"] = listing_id
        
        result = supabase.table("listing_meetup_time_details").insert(time_slots).execute()
        
        return result.data if result.data else []
    except HTTPException:
        raise
    except Exception as e:
        handle_database_error("add listing meetup times", e)


async def delete_listing_meetup_times(user_id: UUID, listing_id: int) -> bool:
    """
    Delete all meetup time slots for a listing.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        # First verify ownership
        listing = await get_listing_by_id(user_id, listing_id, include_seller_info=False)
        validate_record_exists(listing, "Listing not found")
        
        if listing["seller_id"] != user_id:
            raise HTTPException(status_code=403, detail="You can only modify your own listings")
        
        # Delete all meetup time slots for this listing
        result = supabase.table("listing_meetup_time_details").delete().eq("listing_id", listing_id).execute()
        
        return True
    except HTTPException:
        raise
    except Exception as e:
        handle_database_error("delete listing meetup times", e)


async def update_listing_meetup_times(user_id: UUID, listing_id: int, time_slots: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Replace all meetup time slots for a listing with new ones.
    """
    try:
        # First delete existing time slots
        await delete_listing_meetup_times(user_id, listing_id)
        
        # Then add new time slots if any are provided
        if time_slots:
            return await add_listing_meetup_times(user_id, listing_id, time_slots)
        
        return []
    except HTTPException:
        raise
    except Exception as e:
        handle_database_error("update listing meetup times", e)


# Query Builder Functions
def apply_listing_filters(query, category: Optional[str] = None, search: Optional[str] = None, 
                         min_price: Optional[float] = None, max_price: Optional[float] = None,
                         status: Optional[str] = None):
    """Apply common filters to a listings query."""
    if category:
        query = query.eq("category", category)
    
    if status:
        query = query.eq("status", status)
    
    if search:
        # Search in name field only (avoiding or_ method issues)
        search_pattern = f"%{search}%"
        query = query.ilike("name", search_pattern)
    
    if min_price is not None:
        query = query.gte("price_min", min_price)
    
    if max_price is not None:
        query = query.lte("price_max", max_price)
    
    return query


def build_public_listings_query(supabase, user_id: Optional[UUID] = None):
    """Build base query for public listings (excluding current user's listings)."""
    return supabase.table("listings").select(
        "listing_id,seller_id,name,description,category,tags,price_min,price_max,"
        "total_stock,sold_count,status,created_at,updated_at,seller_meetup_locations,"
        "transaction_methods,payment_methods"
    ).neq("seller_id", user_id).not_.is_("seller_id", "null").eq("status", "active")


def build_user_listings_query(supabase, user_id: UUID):
    """Build base query for user's own listings."""
    return supabase.table("listings").select(
        "listing_id,seller_id,name,description,category,tags,price_min,price_max,"
        "total_stock,sold_count,status,created_at,updated_at,seller_meetup_locations,"
        "transaction_methods,payment_methods"
    ).eq("seller_id", user_id)


def build_listing_detail_query(supabase, listing_id: int):
    """Build query for fetching a single listing - simplified without JOIN."""
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
        payment_methods
    """).eq("listing_id", listing_id).eq("status", "active").not_.is_("seller_id", "null")
