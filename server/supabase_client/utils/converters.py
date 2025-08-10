"""
Image processing and data conversion functions.
Handles image fetching, URL processing, and converting database records to response models.
"""

from typing import List, Dict, Any, Optional
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


async def convert_listing_to_product(supabase, listing: Dict[str, Any]) -> ProductListing:
    """
    Convert a database listing record to a ProductListing object.
    Includes fetching and processing associated images.
    """
    # Use existing images from JOIN query if available, otherwise fetch separately
    images = []
    if "listing_images" in listing and listing["listing_images"]:
        # Use images from JOIN query
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
        # Fallback to separate query if not included in JOIN
        images = await get_images_for_listing(supabase, listing["listing_id"])
    
    # Extract seller username and profile info 
    seller_username = str(listing["seller_id"])
    seller_profile_photo_url = None
    
    # Check if user profile data is available from JOIN query first
    if "user_profile" in listing and listing["user_profile"]:
        # Handle both list format (from certain JOIN queries) and dict format
        user_data = listing["user_profile"]
        if isinstance(user_data, list) and len(user_data) > 0:
            user_data = user_data[0]
        
        if isinstance(user_data, dict):
            seller_username = user_data.get("username", str(listing["seller_id"]))
            seller_profile_photo_url = user_data.get("profile_photo_url")
    else:
        # Fallback to direct query if not included in JOIN
        try:
            user_result = supabase.table("user_profile").select("username, profile_photo_url").eq("user_id", listing["seller_id"]).execute()
            if user_result.data and len(user_result.data) > 0:
                user_data = user_result.data[0]
                seller_username = user_data["username"]
                seller_profile_photo_url = user_data.get("profile_photo_url")
        except Exception as e:
            # Only log critical errors to reduce console noise
            pass
    
    # Get seller listing count
    seller_listing_count = 0
    try:
        seller_stats = supabase.table("listings").select("listing_id").eq("seller_id", listing["seller_id"]).eq("status", "active").execute()
        seller_listing_count = len(seller_stats.data) if seller_stats.data else 0
    except Exception:
        # If we can't get the count, just use 0
        pass
    
    # Get meetup schedules
    available_schedules = await get_listing_meetup_schedules(supabase, listing["listing_id"])
    
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


async def convert_listings_to_products(supabase, listings: List[Dict[str, Any]]) -> List[ProductListing]:
    """
    Convert multiple database listing records to ProductListing objects.
    """
    products = []
    for listing in listings:
        product = await convert_listing_to_product(supabase, listing)
        products.append(product)
    return products


async def convert_order_to_response(supabase, order_data: Dict[str, Any]) -> Order:
    """
    Convert a database order record to an Order object.
    Includes fetching and processing associated listing and meetup data.
    """
    # Get listing data for this order - simplified without JOIN
    listing_result = supabase.table("listings").select("*").eq("listing_id", order_data["listing_id"]).execute()
    
    listing = None
    if listing_result.data and len(listing_result.data) > 0:
        listing = await convert_listing_to_product(supabase, listing_result.data[0])
        
        # Get buyer information and add it to the listing for easy access
        buyer_result = supabase.table("user_profile").select(
            "username, profile_photo_url"
        ).eq("user_id", order_data["buyer_id"]).execute()
        
        if buyer_result.data and len(buyer_result.data) > 0:
            buyer_info = buyer_result.data[0]
            # Add buyer information to the listing object for easy access in frontend
            listing.buyer_username = buyer_info.get("username", "Unknown Buyer")
            listing.buyer_profile_photo_url = buyer_info.get("profile_photo_url")
    
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


async def convert_orders_to_response(supabase, orders_data: List[Dict[str, Any]]) -> List[Order]:
    """
    Convert multiple database order records to Order objects.
    """
    orders = []
    for order_data in orders_data:
        order = await convert_order_to_response(supabase, order_data)
        orders.append(order)
    return orders
