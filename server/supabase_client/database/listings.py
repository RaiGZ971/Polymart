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


async def get_listings_by_ids(user_id: UUID, listing_ids: List[int], include_seller_info: bool = True) -> Dict[int, Dict[str, Any]]:
    """
    Get multiple listings by IDs with optimized batch queries.
    Returns a dictionary mapping listing_id to listing data.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        if not listing_ids:
            return {}
        
        # Build base query for listings
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
        
        result = supabase.table("listings").select(select_fields).in_("listing_id", listing_ids).execute()
        
        if not result.data:
            return {}
        
        listings = result.data
        listings_by_id = {listing["listing_id"]: listing for listing in listings}
        
        # Batch fetch images for all listings
        images_result = supabase.table("listing_images").select("listing_id, image_id, image_url, is_primary").in_("listing_id", listing_ids).order("is_primary", desc=True).execute()
        images_by_listing = {}
        if images_result.data:
            for img in images_result.data:
                listing_id = img["listing_id"]
                if listing_id not in images_by_listing:
                    images_by_listing[listing_id] = []
                images_by_listing[listing_id].append(img)
        
        # Batch fetch meetup schedules for all listings
        meetup_result = supabase.table("listing_meetup_time_details").select("listing_id, start_time, end_time").in_("listing_id", listing_ids).execute()
        meetups_by_listing = {}
        if meetup_result.data:
            for meetup in meetup_result.data:
                listing_id = meetup["listing_id"]
                if listing_id not in meetups_by_listing:
                    meetups_by_listing[listing_id] = []
                meetups_by_listing[listing_id].append(meetup)
        
        # Batch fetch user profiles if requested
        seller_ids = list(set([listing["seller_id"] for listing in listings]))
        user_profiles = {}
        if include_seller_info and seller_ids:
            user_result = supabase.table("user_profile").select("user_id, username, profile_photo_url").in_("user_id", seller_ids).execute()
            if user_result.data:
                user_profiles = {str(profile["user_id"]): profile for profile in user_result.data}
        
        # Attach batch data to each listing
        for listing in listings:
            listing_id = listing["listing_id"]
            seller_id = str(listing["seller_id"])
            
            listing["listing_images"] = images_by_listing.get(listing_id, [])
            listing["meetup_data"] = meetups_by_listing.get(listing_id, [])
            listing["user_profile"] = user_profiles.get(seller_id, {})
        
        return listings_by_id
        
    except Exception as e:
        handle_database_error("get listings by IDs", e)
        return {}


async def get_listing_by_id(user_id: UUID, listing_id: int, include_seller_info: bool = True) -> Optional[Dict[str, Any]]:
    """
    Get a specific listing by ID with optimized batch queries.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        # Build base query for listing
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
            listing = result.data[0]
            
            # Use batch processing approach for consistency
            listing_ids = [listing_id]
            seller_ids = [listing["seller_id"]]
            
            # Batch fetch images for this listing
            images_result = supabase.table("listing_images").select("listing_id, image_id, image_url, is_primary").in_("listing_id", listing_ids).order("is_primary", desc=True).execute()
            images_by_listing = {}
            if images_result.data:
                for img in images_result.data:
                    listing_id_val = img["listing_id"]
                    if listing_id_val not in images_by_listing:
                        images_by_listing[listing_id_val] = []
                    images_by_listing[listing_id_val].append(img)
            
            # Batch fetch meetup schedules for this listing
            meetup_result = supabase.table("listing_meetup_time_details").select("listing_id, start_time, end_time").in_("listing_id", listing_ids).execute()
            meetups_by_listing = {}
            if meetup_result.data:
                for meetup in meetup_result.data:
                    listing_id_val = meetup["listing_id"]
                    if listing_id_val not in meetups_by_listing:
                        meetups_by_listing[listing_id_val] = []
                    meetups_by_listing[listing_id_val].append(meetup)
            
            # Batch fetch user profiles if requested
            user_profiles = {}
            if include_seller_info and seller_ids:
                user_result = supabase.table("user_profile").select("user_id, username, profile_photo_url").in_("user_id", seller_ids).execute()
                if user_result.data:
                    user_profiles = {str(profile["user_id"]): profile for profile in user_result.data}
            
            # Attach batch data to listing
            listing["listing_images"] = images_by_listing.get(listing_id, [])
            listing["meetup_data"] = meetups_by_listing.get(listing_id, [])
            listing["user_profile"] = user_profiles.get(str(listing["seller_id"]), {})
            
            return listing
        return None
    except Exception as e:
        handle_database_error("get listing by ID", e)


async def get_public_listings(user_id: Optional[UUID] = None, page: int = 1, page_size: int = 20, 
                             category: Optional[str] = None, search: Optional[str] = None,
                             min_price: Optional[float] = None, max_price: Optional[float] = None,
                             sort_by: Optional[str] = "newest") -> Dict[str, Any]:
    """
    Get public listings (excluding user's own listings) with optimized batch queries.
    Includes inactive listings if the user has pending orders on them.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        # First, get listings with active status
        active_query = supabase.table("listings").select("""
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
        
        # Also get inactive listings where user has pending orders
        inactive_listings_with_orders = []
        if user_id:
            # Get listing IDs where user has pending orders
            orders_result = supabase.table("orders").select("listing_id").eq(
                "buyer_id", user_id
            ).in_("status", ["pending", "confirmed"]).execute()
            
            if orders_result.data:
                listing_ids_with_orders = list(set([order["listing_id"] for order in orders_result.data]))
                
                # Get inactive listings where user has pending orders
                inactive_query = supabase.table("listings").select("""
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
                """).eq("status", "inactive").neq("seller_id", user_id).in_("listing_id", listing_ids_with_orders)
                
                inactive_result = inactive_query.execute()
                inactive_listings_with_orders = inactive_result.data if inactive_result.data else []
        
        # Build the main query for active listings
        query = active_query
        
        # Apply filters to active listings
        if category:
            query = query.eq("category", category)
        
        if search:
            search_pattern = f"%{search}%"
            query = query.ilike("name", search_pattern)
        
        if min_price is not None:
            query = query.gte("price_min", min_price)
        
        if max_price is not None:
            query = query.lte("price_max", max_price)
        
        # Execute active listings query
        active_result = query.execute()
        active_listings = active_result.data if active_result.data else []
        
        # Apply the same filters to inactive listings with orders
        filtered_inactive_listings = []
        if inactive_listings_with_orders:
            for listing in inactive_listings_with_orders:
                # Apply category filter
                if category and listing.get("category") != category:
                    continue
                    
                # Apply search filter
                if search and search.lower() not in listing.get("name", "").lower():
                    continue
                    
                # Apply price filters
                if min_price is not None and listing.get("price_min", 0) < min_price:
                    continue
                    
                if max_price is not None and listing.get("price_max", float('inf')) > max_price:
                    continue
                    
                filtered_inactive_listings.append(listing)
        
        # Combine active and filtered inactive listings
        all_listings = active_listings + filtered_inactive_listings
        
        # Get total count for pagination (active + inactive with orders)
        # For count query, we need to do the same logic
        count_query = supabase.table("listings").select("listing_id", count="exact").eq("status", "active").neq("seller_id", user_id)
        
        # Apply same filters to count query for active listings
        if category:
            count_query = count_query.eq("category", category)
        if search:
            count_query = count_query.ilike("name", f"%{search}%")
        if min_price is not None:
            count_query = count_query.gte("price_min", min_price)
        if max_price is not None:
            count_query = count_query.lte("price_max", max_price)
        
        count_result = count_query.execute()
        active_count = getattr(count_result, 'count', None)
        if active_count is None:
            active_count = len(count_result.data) if count_result.data else 0
        
        # Add count of filtered inactive listings with orders
        total_count = active_count + len(filtered_inactive_listings)
        
        # Apply sorting to combined listings
        if sort_by == "price_low_high":
            all_listings.sort(key=lambda x: x.get("price_min", 0))
        elif sort_by == "price_high_low":
            all_listings.sort(key=lambda x: x.get("price_min", 0), reverse=True)
        elif sort_by == "name_a_z":
            all_listings.sort(key=lambda x: x.get("name", "").lower())
        elif sort_by == "name_z_a":
            all_listings.sort(key=lambda x: x.get("name", "").lower(), reverse=True)
        elif sort_by == "date_oldest":
            all_listings.sort(key=lambda x: x.get("created_at", ""))
        else:  # Default to newest
            all_listings.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        
        # Apply pagination to combined and sorted listings
        offset = calculate_pagination_offset(page, page_size)
        paginated_listings = all_listings[offset:offset + page_size]
        
        listings = paginated_listings
        
        # Batch fetch related data for all listings
        if listings:
            # Get all unique seller IDs
            seller_ids = list(set([listing["seller_id"] for listing in listings]))
            listing_ids = [listing["listing_id"] for listing in listings]
            
            # Batch fetch user profiles
            user_profiles = {}
            if seller_ids:
                user_result = supabase.table("user_profile").select("user_id, username, profile_photo_url").in_("user_id", seller_ids).execute()
                if user_result.data:
                    user_profiles = {str(profile["user_id"]): profile for profile in user_result.data}
            
            # Batch fetch images for all listings
            images_result = supabase.table("listing_images").select("listing_id, image_id, image_url, is_primary").in_("listing_id", listing_ids).order("is_primary", desc=True).execute()
            images_by_listing = {}
            if images_result.data:
                for img in images_result.data:
                    listing_id = img["listing_id"]
                    if listing_id not in images_by_listing:
                        images_by_listing[listing_id] = []
                    images_by_listing[listing_id].append(img)
            
            # Batch fetch meetup schedules for all listings
            meetup_result = supabase.table("listing_meetup_time_details").select("listing_id, start_time, end_time").in_("listing_id", listing_ids).execute()
            meetups_by_listing = {}
            if meetup_result.data:
                for meetup in meetup_result.data:
                    listing_id = meetup["listing_id"]
                    if listing_id not in meetups_by_listing:
                        meetups_by_listing[listing_id] = []
                    meetups_by_listing[listing_id].append(meetup)
            
            # Attach related data to each listing
            for listing in listings:
                seller_id = str(listing["seller_id"])
                listing_id = listing["listing_id"]
                
                # Add user profile data
                listing["user_profile"] = user_profiles.get(seller_id, {})
                
                # Add images data
                listing["listing_images"] = images_by_listing.get(listing_id, [])
                
                # Add meetup data
                listing["meetup_data"] = meetups_by_listing.get(listing_id, [])
        
        return {
            "listings": listings,
            "total_count": total_count
        }
    except Exception as e:
        handle_database_error("get public listings", e)


async def get_user_listings(user_id: UUID, category: Optional[str] = None, 
                           search: Optional[str] = None, status: Optional[str] = None,
                           sort_by: Optional[str] = "newest") -> List[Dict[str, Any]]:
    """
    Get user's own listings with optimized batch queries.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        # Build base query for listings
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
        else:  # Default to newest
            query = query.order("created_at", desc=True)
        
        result = query.execute()
        listings = result.data if result.data else []
        
        # Batch fetch related data for all listings
        if listings:
            # Get all unique seller IDs (should be just one for user listings)
            seller_ids = list(set([listing["seller_id"] for listing in listings]))
            listing_ids = [listing["listing_id"] for listing in listings]
            
            # Batch fetch user profiles
            user_profiles = {}
            if seller_ids:
                user_result = supabase.table("user_profile").select("user_id, username, profile_photo_url").in_("user_id", seller_ids).execute()
                if user_result.data:
                    user_profiles = {str(profile["user_id"]): profile for profile in user_result.data}
            
            # Batch fetch images for all listings
            images_result = supabase.table("listing_images").select("listing_id, image_id, image_url, is_primary").in_("listing_id", listing_ids).order("is_primary", desc=True).execute()
            images_by_listing = {}
            if images_result.data:
                for img in images_result.data:
                    listing_id = img["listing_id"]
                    if listing_id not in images_by_listing:
                        images_by_listing[listing_id] = []
                    images_by_listing[listing_id].append(img)
            
            # Batch fetch meetup schedules for all listings
            meetup_result = supabase.table("listing_meetup_time_details").select("listing_id, start_time, end_time").in_("listing_id", listing_ids).execute()
            meetups_by_listing = {}
            if meetup_result.data:
                for meetup in meetup_result.data:
                    listing_id = meetup["listing_id"]
                    if listing_id not in meetups_by_listing:
                        meetups_by_listing[listing_id] = []
                    meetups_by_listing[listing_id].append(meetup)
            
            # Attach related data to each listing
            for listing in listings:
                seller_id = str(listing["seller_id"])
                listing_id = listing["listing_id"]
                
                # Add user profile data
                listing["user_profile"] = user_profiles.get(seller_id, {})
                
                # Add images data
                listing["listing_images"] = images_by_listing.get(listing_id, [])
                
                # Add meetup data
                listing["meetup_data"] = meetups_by_listing.get(listing_id, [])
        
        return listings
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
