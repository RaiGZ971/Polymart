"""
Image processing and data conversion functions.
Handles image fetching, URL processing, and converting database records to response models.
"""

from typing import List, Dict, Any, Optional
from supabase_client.schemas import ListingImage, ProductListing, Order, Meetup
from core.config import ensure_proper_image_urls


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


async def convert_order_to_response(supabase, order_data: Dict[str, Any]) -> Order:
    """
    Convert a database order record to an Order object.
    Includes fetching and processing associated listing and meetup data.
    """
    # Get listing data for this order
    listing_result = supabase.table("product_listings").select("""
        *,
        user_profile:seller_id (username)
    """).eq("listing_id", order_data["listing_id"]).single().execute()
    
    listing = None
    if listing_result.data:
        listing = await convert_listing_to_product(supabase, listing_result.data)
    
    # Get meetup data if order uses meetup transaction method
    meetup = None
    if order_data.get("transaction_method") == "meet_up":
        meetup_result = supabase.table("meetups").select("*").eq("order_id", order_data["order_id"]).single().execute()
        if meetup_result.data:
            meetup_data = meetup_result.data
            meetup = Meetup(
                meetup_id=meetup_data["meetup_id"],
                order_id=meetup_data["order_id"],
                location=meetup_data.get("location"),
                scheduled_at=meetup_data["scheduled_at"],
                status=meetup_data["status"],
                confirmed_by_buyer=meetup_data["confirmed_by_buyer"],
                confirmed_by_seller=meetup_data["confirmed_by_seller"],
                confirmed_at=meetup_data.get("confirmed_at"),
                cancelled_at=meetup_data.get("cancelled_at"),
                cancellation_reason=meetup_data.get("cancellation_reason"),
                remarks=meetup_data.get("remarks"),
                created_at=meetup_data["created_at"],
                updated_at=meetup_data["updated_at"]
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
