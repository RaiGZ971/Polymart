"""
Image processing and data conversion functions.
Handles image fetching, URL processing, and converting database records to response models.
"""

from typing import List, Dict, Any, Optional
from uuid import UUID
from supabase_client.schemas import ListingImage, ProductListing, Order, Meetup, MeetupSchedule
from core.config import ensure_proper_image_urls
from datetime import datetime


def timestamp_to_time_slot(start_time: str, end_time: str) -> str:
    """
    Convert timestamp range to 12-hour time format like '9:00 AM - 10:30 AM'.
    """
    try:
        start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
        end_dt = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
        
        # Format times in 12-hour format and remove leading zeros
        start_formatted = start_dt.strftime('%I:%M %p').lstrip('0').replace(' 0', ' ')
        end_formatted = end_dt.strftime('%I:%M %p').lstrip('0').replace(' 0', ' ')
        
        return f"{start_formatted} - {end_formatted}"
    except Exception:
        # Fallback to original format if conversion fails
        return f"{start_time}-{end_time}"


async def get_listing_meetup_schedules(supabase, listing_id: int) -> List[MeetupSchedule]:
    """
    Fetch and transform meetup time details for a listing into the expected format.
    """
    try:
        # Fetch meetup times from database
        result = supabase.table("listing_meetup_time_details").select("*").eq("listing_id", listing_id).execute()
        
        if not result.data:
            return []
        
        # Group by date and collect time slots
        date_groups = {}
        for time_detail in result.data:
            start_time = time_detail["start_time"]
            end_time = time_detail["end_time"]
            
            # Extract date from start_time
            start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
            date_str = start_dt.strftime('%Y-%m-%d')
            
            # Convert to time slot
            time_slot = timestamp_to_time_slot(start_time, end_time)
            
            if date_str not in date_groups:
                date_groups[date_str] = []
            date_groups[date_str].append(time_slot)
        
        # Convert to MeetupSchedule objects
        schedules = []
        for date, times in date_groups.items():
            schedules.append(MeetupSchedule(date=date, times=times))
        
        return schedules
    except Exception as e:
        # Only log to file, not console to reduce noise
        return []


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


async def convert_listing_to_product(supabase, listing: Dict[str, Any], current_user_id: Optional[UUID] = None) -> ProductListing:
    """
    Convert a database listing record to a ProductListing object.
    Now optimized to use batch data instead of separate queries.
    """
    # Use images from batch query - no more separate image queries
    images = []
    if "listing_images" in listing and listing["listing_images"]:
        # Use images from batch query
        image_urls = [img["image_url"] for img in listing["listing_images"]]
        proper_urls = ensure_proper_image_urls(image_urls, is_private=False)
        
        images = [
            ListingImage(
                image_id=img["image_id"],
                image_url=proper_url,
                is_primary=img["is_primary"]
            )
            for img, proper_url in zip(listing["listing_images"], proper_urls)
        ]
    else:
        # This should not happen with the new batch approach
        print(f"Warning: No images found for listing {listing['listing_id']}")
        images = []
    
    # Extract seller username and profile info from batch data
    seller_username = str(listing["seller_id"])
    seller_profile_photo_url = None
    
    # Use user profile data from batch query - no more separate user queries
    if "user_profile" in listing and listing["user_profile"]:
        user_data = listing["user_profile"]
        if isinstance(user_data, dict):
            seller_username = user_data.get("username", str(listing["seller_id"]))
            seller_profile_photo_url = user_data.get("profile_photo_url")
    else:
        # This should not happen with the new batch approach
        print(f"Warning: No user profile found for listing {listing['listing_id']}")
    
    # Get seller listing count from batch data if available, otherwise skip
    seller_listing_count = 0
    # Fetch seller's listing count if current_user_id is provided
    if current_user_id:
        try:
            from supabase_client.database.listings import get_seller_listing_count
            seller_listing_count = await get_seller_listing_count(
                user_id=current_user_id, 
                seller_id=listing["seller_id"]
            )
        except Exception as e:
            print(f"Warning: Could not fetch seller listing count: {e}")
            seller_listing_count = 0
    
    # Get meetup schedules from batch data - no more separate queries
    available_schedules = []
    if "meetup_data" in listing and listing["meetup_data"]:
        # Process meetup data from batch query
        from .converters import timestamp_to_time_slot
        
        # Group by date and collect time slots
        date_groups = {}
        for time_detail in listing["meetup_data"]:
            start_time = time_detail["start_time"]
            end_time = time_detail["end_time"]
            
            # Extract date from start_time
            from datetime import datetime
            start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
            date_str = start_dt.strftime('%Y-%m-%d')
            
            # Convert to time slot
            time_slot = timestamp_to_time_slot(start_time, end_time)
            
            if date_str not in date_groups:
                date_groups[date_str] = []
            date_groups[date_str].append(time_slot)
        
        # Convert to MeetupSchedule objects
        from supabase_client.schemas import MeetupSchedule
        for date, times in date_groups.items():
            available_schedules.append(MeetupSchedule(date=date, times=times))
    
    return ProductListing(
        listing_id=listing["listing_id"],
        seller_id=listing["seller_id"],
        seller_username=seller_username,
        seller_listing_count=seller_listing_count,
        seller_profile_photo_url=seller_profile_photo_url,
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
        transaction_methods=listing.get("transaction_methods"),
        payment_methods=listing.get("payment_methods"),
        available_schedules=available_schedules,
        images=images
    )


async def convert_listings_to_products(supabase, listings: List[Dict[str, Any]], current_user_id: Optional[UUID] = None) -> List[ProductListing]:
    """
    Convert multiple database listing records to ProductListing objects.
    """
    products = []
    for listing in listings:
        product = await convert_listing_to_product(supabase, listing, current_user_id)
        products.append(product)
    return products


async def convert_order_to_response_with_batch_data(supabase, order_data: Dict[str, Any], listing_data: Optional[Dict[str, Any]], meetups_data: List[Dict[str, Any]], buyer_data: Dict[str, Any], current_user_id: Optional[UUID] = None) -> Order:
    """
    Convert a database order record to an Order object using pre-fetched batch data.
    """
    listing = None
    if listing_data:
        # Use pre-fetched listing data
        listing = await convert_listing_to_product(supabase, listing_data, current_user_id)
        
        # Use pre-fetched buyer information
        if buyer_data:
            listing.buyer_username = buyer_data.get("username", "Unknown Buyer")
            listing.buyer_profile_photo_url = buyer_data.get("profile_photo_url")
    
    # Use pre-fetched meetup data instead of individual query
    meetup = None
    if order_data.get("transaction_method") == "Meet-up" and meetups_data:
        # Find the current meetup (is_current = True)
        current_meetup = next((m for m in meetups_data if m.get("is_current", False)), meetups_data[0] if meetups_data else None)
        
        if current_meetup:
            meetup = Meetup(
                meetup_id=current_meetup["meetup_id"],
                order_id=current_meetup["order_id"],
                location=current_meetup.get("location"),
                scheduled_at=current_meetup["scheduled_at"],
                status=current_meetup["status"],
                confirmed_by_buyer=current_meetup["confirmed_by_buyer"],
                confirmed_by_seller=current_meetup["confirmed_by_seller"],
                remarks=current_meetup.get("remarks"),
                proposed_by=current_meetup.get("proposed_by"),
                changed_at=current_meetup["changed_at"],
                is_current=current_meetup["is_current"]
            )
    
    return Order(
        order_id=order_data["order_id"],
        buyer_id=order_data["buyer_id"],
        seller_id=order_data["seller_id"],
        listing_id=order_data["listing_id"],
        quantity=order_data["quantity"],
        buyer_requested_price=order_data.get("buyer_requested_price"),
        price_at_purchase=order_data["price_at_purchase"],
        status=order_data["status"],
        transaction_method=order_data["transaction_method"],
        payment_method=order_data["payment_method"],
        placed_at=order_data["placed_at"],
        listing=listing,
        meetup=meetup
    )


async def convert_order_to_response(supabase, order_data: Dict[str, Any]) -> Order:
    """
    Convert a database order record to an Order object.
    Includes fetching and processing associated listing and meetup data.
    Note: This function is kept for backward compatibility but should use the batch version for multiple orders.
    """
    # Get listing data for this order using batch-optimized function
    from supabase_client.database import listings as listings_db
    from uuid import UUID
    
    listing = None
    try:
        # Use the batch-optimized function instead of raw query
        listing_result = await listings_db.get_listing_by_id(
            UUID(order_data["buyer_id"]),  # Use buyer_id as user_id for auth
            order_data["listing_id"], 
            include_seller_info=True
        )
        
        if listing_result:
            listing = await convert_listing_to_product(supabase, listing_result, UUID(order_data["buyer_id"]))
            
            # Get buyer information and add it to the listing for easy access
            buyer_result = supabase.table("user_profile").select(
                "username, profile_photo_url"
            ).eq("user_id", order_data["buyer_id"]).execute()
            
            if buyer_result.data and len(buyer_result.data) > 0:
                buyer_info = buyer_result.data[0]
                # Add buyer information to the listing object for easy access in frontend
                listing.buyer_username = buyer_info.get("username", "Unknown Buyer")
                listing.buyer_profile_photo_url = buyer_info.get("profile_photo_url")
    except Exception as e:
        print(f"Error fetching listing details for order {order_data['order_id']}: {e}")
        # Continue without listing details
    
    # Get meetup data if order uses meetup transaction method
    meetup = None
    if order_data.get("transaction_method") == "Meet-up":
        meetup_result = supabase.table("meetups").select("*").eq("order_id", order_data["order_id"]).execute()
        if meetup_result.data and len(meetup_result.data) > 0:
            meetup_data = meetup_result.data[0]
            meetup = Meetup(
                meetup_id=meetup_data["meetup_id"],
                order_id=meetup_data["order_id"],
                location=meetup_data.get("location"),
                scheduled_at=meetup_data["scheduled_at"],
                status=meetup_data["status"],
                confirmed_by_buyer=meetup_data["confirmed_by_buyer"],
                confirmed_by_seller=meetup_data["confirmed_by_seller"],
                remarks=meetup_data.get("remarks"),
                proposed_by=meetup_data.get("proposed_by"),
                changed_at=meetup_data["changed_at"],
                is_current=meetup_data["is_current"]
            )
    
    return Order(
        order_id=order_data["order_id"],
        buyer_id=order_data["buyer_id"],
        seller_id=order_data["seller_id"],
        listing_id=order_data["listing_id"],
        quantity=order_data["quantity"],
        buyer_requested_price=order_data.get("buyer_requested_price"),
        price_at_purchase=order_data["price_at_purchase"],
        status=order_data["status"],
        transaction_method=order_data["transaction_method"],
        payment_method=order_data["payment_method"],
        placed_at=order_data["placed_at"],
        listing=listing,
        meetup=meetup
    )


async def convert_orders_to_response(supabase, orders_data: List[Dict[str, Any]], current_user_id: Optional[UUID] = None) -> List[Order]:
    """
    Convert multiple database order records to Order objects.
    Now optimized with true batch processing for listings, meetups, and buyer info.
    """
    if not orders_data:
        return []
    
    # Collect all unique IDs for batch processing
    order_ids = [order["order_id"] for order in orders_data]
    listing_ids = list(set([order["listing_id"] for order in orders_data]))  # Remove duplicates
    buyer_ids = list(set([order["buyer_id"] for order in orders_data]))  # Remove duplicates
    seller_ids = list(set([order["seller_id"] for order in orders_data]))  # Remove duplicates
    
    # Batch fetch all listings data
    from supabase_client.database import listings as listings_db
    from uuid import UUID
    
    listings_by_id = {}
    if listing_ids:
        try:
            # Use the new batch function for multiple listings
            user_id = UUID(buyer_ids[0]) if buyer_ids else None
            if user_id:
                listings_by_id = await listings_db.get_listings_by_ids(
                    user_id, listing_ids, include_seller_info=True
                )
        except Exception as e:
            print(f"Error in batch listing fetch: {e}")
    
    # Batch fetch meetup data for all orders
    meetups_by_order = {}
    meetup_result = supabase.table("meetups").select("*").in_("order_id", order_ids).execute()
    if meetup_result.data:
        for meetup in meetup_result.data:
            order_id = meetup["order_id"]
            if order_id not in meetups_by_order:
                meetups_by_order[order_id] = []
            meetups_by_order[order_id].append(meetup)
    
    # Batch fetch buyer information for all orders
    buyers_by_id = {}
    buyer_result = supabase.table("user_profile").select("user_id, username, profile_photo_url").in_("user_id", buyer_ids).execute()
    if buyer_result.data:
        for buyer in buyer_result.data:
            buyers_by_id[str(buyer["user_id"])] = buyer
    
    # Process each order with batch data
    orders = []
    for order_data in orders_data:
        order = await convert_order_to_response_with_batch_data(
            supabase, 
            order_data, 
            listings_by_id.get(order_data["listing_id"]),
            meetups_by_order.get(order_data["order_id"], []),
            buyers_by_id.get(str(order_data["buyer_id"]), {}),
            current_user_id
        )
        orders.append(order)
    
    return orders
