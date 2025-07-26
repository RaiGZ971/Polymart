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

VALID_ORDER_STATUSES = {"pending", "confirmed", "completed", "cancelled"}

VALID_TRANSACTION_METHODS = {"meet_up", "online"}

VALID_PAYMENT_METHODS = {"cash", "gcash", "maya", "bank_transfer", "remittance"}

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

def validate_order_transaction_method(transaction_method: str) -> None:
    """Validate order transaction method against allowed values."""
    if transaction_method not in VALID_TRANSACTION_METHODS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid transaction method. Valid methods are: {', '.join(VALID_TRANSACTION_METHODS)}"
        )

def validate_order_payment_method(payment_method: str) -> None:
    """Validate order payment method against allowed values."""
    if payment_method not in VALID_PAYMENT_METHODS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid payment method. Valid methods are: {', '.join(VALID_PAYMENT_METHODS)}"
        )

def validate_order_status(status: Optional[str]) -> None:
    """Validate order status against allowed values."""
    if status and status not in VALID_ORDER_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid order status. Valid statuses are: {', '.join(VALID_ORDER_STATUSES)}"
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

# Order Helper Functions
async def check_listing_availability(supabase, listing_id: int, quantity: int, buyer_id: int) -> Dict[str, Any]:
    """
    Check if a listing exists, is active, has sufficient stock, and buyer is not the seller.
    Returns the listing data if valid.
    """
    listing_result = supabase.table("listings").select(
        "listing_id,seller_id,name,status,total_stock,sold_count,price_min,price_max"
    ).eq("listing_id", listing_id).execute()
    
    if not listing_result.data or len(listing_result.data) == 0:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    listing = listing_result.data[0]
    
    # Check if listing is active
    if listing["status"] != "active":
        raise HTTPException(status_code=400, detail="Listing is not available for purchase")
    
    # Check if buyer is not the seller
    if listing["seller_id"] == buyer_id:
        raise HTTPException(status_code=400, detail="Cannot purchase your own listing")
    
    # Check stock availability
    if listing["total_stock"] is not None and listing["total_stock"] < quantity:
        raise HTTPException(
            status_code=400, 
            detail=f"Insufficient stock. Available: {listing['total_stock']}, Requested: {quantity}"
        )
    
    return listing

async def create_order_record(supabase, buyer_id: int, seller_id: int, listing_id: int, 
                            quantity: int, price_at_purchase: float, 
                            transaction_method: str, payment_method: str, 
                            buyer_requested_price: Optional[float] = None) -> Dict[str, Any]:
    """
    Create a new order record in the database.
    """
    order_data = {
        "buyer_id": buyer_id,
        "seller_id": seller_id,
        "listing_id": listing_id,
        "quantity": quantity,
        "buyer_requested_price": buyer_requested_price,
        "price_at_purchase": price_at_purchase,
        "transaction_method": transaction_method,
        "payment_method": payment_method,
        "status": "pending"
    }
    
    result = supabase.table("orders").insert(order_data).execute()
    
    if not result.data or len(result.data) == 0:
        raise HTTPException(status_code=500, detail="Failed to create order")
    
    return result.data[0]

async def update_listing_stock(supabase, listing_id: int, quantity: int) -> None:
    """
    Update listing stock after an order is placed.
    Also updates sold_count.
    """
    # Get current listing data
    listing_result = supabase.table("listings").select(
        "total_stock,sold_count"
    ).eq("listing_id", listing_id).execute()
    
    if not listing_result.data:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    listing = listing_result.data[0]
    
    # Calculate new values
    new_sold_count = listing["sold_count"] + quantity
    new_total_stock = None
    
    if listing["total_stock"] is not None:
        new_total_stock = listing["total_stock"] - quantity
        if new_total_stock < 0:
            raise HTTPException(status_code=400, detail="Insufficient stock")
    
    # Update listing
    update_data = {"sold_count": new_sold_count}
    if new_total_stock is not None:
        update_data["total_stock"] = new_total_stock
    
    result = supabase.table("listings").update(update_data).eq("listing_id", listing_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to update listing stock")

async def get_order_by_id(supabase, order_id: int, user_id: int) -> Dict[str, Any]:
    """
    Get order by ID, ensuring user has access (buyer or seller).
    """
    order_result = supabase.table("orders").select("""
        order_id,
        buyer_id,
        seller_id,
        listing_id,
        quantity,
        price_at_purchase,
        status,
        transaction_method,
        payment_method,
        placed_at
    """).eq("order_id", order_id).execute()
    
    if not order_result.data or len(order_result.data) == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order = order_result.data[0]
    
    # Check if user has access to this order
    if order["buyer_id"] != user_id and order["seller_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied to this order")
    
    return order

async def convert_order_to_response(supabase, order_data: Dict[str, Any]):
    """
    Convert order data to Order response model.
    Includes associated listing information and meetup details if applicable.
    """
    from supabase_client.schemas import Order, Meetup
    
    # Get listing information
    listing = None
    if order_data.get("listing_id"):
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
        """).eq("listing_id", order_data["listing_id"]).execute()
        
        if listing_result.data:
            listing = await convert_listing_to_product(supabase, listing_result.data[0])
    
    # Get meetup information if transaction method is meet_up
    meetup = None
    if order_data.get("transaction_method") == "meet_up":
        meetup_result = supabase.table("meetups").select("*").eq("order_id", order_data["order_id"]).execute()
        
        if meetup_result.data:
            meetup_data = meetup_result.data[0]
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
        price_at_purchase=float(order_data["price_at_purchase"]),
        status=order_data["status"],
        transaction_method=order_data["transaction_method"],
        payment_method=order_data["payment_method"],
        placed_at=order_data["placed_at"],
        listing=listing,
        meetup=meetup
    )

async def get_user_orders(supabase, user_id: int, page: int = 1, page_size: int = 20, 
                         status: Optional[str] = None, as_buyer: Optional[bool] = None) -> Dict[str, Any]:
    """
    Get user's orders with pagination and filtering.
    """
    # Validate status if provided
    if status:
        validate_order_status(status)
    
    # Build base query
    query = supabase.table("orders").select("""
        order_id,
        buyer_id,
        seller_id,
        listing_id,
        quantity,
        buyer_requested_price,
        price_at_purchase,
        status,
        transaction_method,
        payment_method,
        placed_at
    """)
    
    # Apply user filter (buyer or seller)
    if as_buyer is True:
        query = query.eq("buyer_id", user_id)
    elif as_buyer is False:
        query = query.eq("seller_id", user_id)
    else:
        # Get orders where user is either buyer or seller
        query = query.or_(f"buyer_id.eq.{user_id},seller_id.eq.{user_id}")
    
    # Apply status filter if provided
    if status:
        query = query.eq("status", status)
    
    # Get total count for pagination
    count_result = query.execute()
    total_count = len(count_result.data) if count_result.data else 0
    
    # Apply pagination and ordering
    offset = calculate_pagination_offset(page, page_size)
    query = query.order("placed_at", desc=True).range(offset, offset + page_size - 1)
    
    # Execute final query
    result = query.execute()
    orders = result.data if result.data else []
    
    return {
        "orders": orders,
        "total_count": total_count
    }

async def convert_orders_to_response(supabase, orders: List[Dict[str, Any]]) -> List:
    """
    Convert multiple order records to Order response models.
    """
    order_responses = []
    for order in orders:
        order_response = await convert_order_to_response(supabase, order)
        order_responses.append(order_response)
    return order_responses

# Meetup Helper Functions
async def create_meetup_record(supabase, order_id: int) -> Dict[str, Any]:
    """
    Create a meetup record for a meet_up transaction order.
    Initially creates with status 'pending' and placeholder scheduled_at.
    """
    from datetime import datetime, timedelta
    
    # Create placeholder meetup with default scheduled time (can be updated later)
    default_scheduled_at = (datetime.now() + timedelta(days=1)).isoformat()
    
    meetup_data = {
        "order_id": order_id,
        "scheduled_at": default_scheduled_at,
        "status": "pending",
        "confirmed_by_buyer": False,
        "confirmed_by_seller": False
    }
    
    result = supabase.table("meetups").insert(meetup_data).execute()
    
    if not result.data or len(result.data) == 0:
        raise HTTPException(status_code=500, detail="Failed to create meetup record")
    
    return result.data[0]
