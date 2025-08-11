"""
Order-related database operations.
Handles order creation, retrieval, updates, and related validations.
"""

from typing import Dict, Any, List, Optional
from fastapi import HTTPException
from uuid import UUID
from .base import get_authenticated_client, handle_database_error, calculate_pagination_offset, validate_record_exists, validate_user_access


async def check_existing_pending_orders(user_id: UUID, listing_id: int) -> bool:
    """
    Check if user already has a pending order for this listing.
    Returns True if pending order exists, False otherwise.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        # Check for existing pending orders
        result = supabase.table("orders").select("order_id").eq(
            "buyer_id", user_id
        ).eq(
            "listing_id", listing_id
        ).eq(
            "status", "pending"
        ).execute()
        
        return len(result.data) > 0
        
    except Exception as e:
        handle_database_error("check existing pending orders", e)


async def check_listing_availability(user_id: UUID, listing_id: int, quantity: int, buyer_id: UUID) -> Dict[str, Any]:
    """
    Check if a listing exists, is active, has sufficient stock, and buyer is not the seller.
    Returns the listing data if valid.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        listing_result = supabase.table("listings").select(
            "listing_id,seller_id,name,status,total_stock,sold_count,price_min,price_max,transaction_methods,payment_methods"
        ).eq("listing_id", listing_id).execute()
        
        validate_record_exists(listing_result.data, "Listing not found")
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
    except HTTPException:
        raise
    except Exception as e:
        handle_database_error("check listing availability", e)


async def create_order(user_id: UUID, order_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a new order record in the database.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        # Set default status if not provided
        if "status" not in order_data:
            order_data["status"] = "pending"
        
        result = supabase.table("orders").insert(order_data).execute()
        
        validate_record_exists(result.data, "Failed to create order")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        handle_database_error("create order", e)


async def get_order_by_id(user_id: UUID, order_id: int) -> Dict[str, Any]:
    """
    Get order by ID, ensuring user has access (buyer or seller).
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        order_result = supabase.table("orders").select("""
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
        """).eq("order_id", order_id).execute()
        
        validate_record_exists(order_result.data, "Order not found")
        order = order_result.data[0]
        
        # Check if user has access to this order
        if order["buyer_id"] != user_id and order["seller_id"] != user_id:
            raise HTTPException(status_code=403, detail="Access denied to this order")
        
        return order
    except HTTPException:
        raise
    except Exception as e:
        handle_database_error("get order by ID", e)


async def get_user_orders(user_id: UUID, page: int = 1, page_size: int = 20, 
                         status: Optional[str] = None, as_buyer: Optional[bool] = None) -> Dict[str, Any]:
    """
    Get user's orders with pagination and filtering.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
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
            # For getting orders where user is either buyer or seller,
            # we need to make separate queries and combine results
            buyer_query = supabase.table("orders").select("""
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
            """).eq("buyer_id", user_id)
            
            seller_query = supabase.table("orders").select("""
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
            """).eq("seller_id", user_id)
            
            # Apply status filter if provided
            if status:
                buyer_query = buyer_query.eq("status", status)
                seller_query = seller_query.eq("status", status)
            
            # Execute both queries
            buyer_result = buyer_query.order("placed_at", desc=True).execute()
            seller_result = seller_query.order("placed_at", desc=True).execute()
            
            # Combine and deduplicate results
            all_orders = []
            seen_order_ids = set()
            
            for order in (buyer_result.data or []) + (seller_result.data or []):
                if order["order_id"] not in seen_order_ids:
                    all_orders.append(order)
                    seen_order_ids.add(order["order_id"])
            
            # Sort by placed_at descending
            all_orders.sort(key=lambda x: x["placed_at"], reverse=True)
            
            # Apply pagination
            total_count = len(all_orders)
            offset = calculate_pagination_offset(page, page_size)
            paginated_orders = all_orders[offset:offset + page_size]
            
            return {
                "orders": paginated_orders,
                "total_count": total_count,
                "page": page,
                "page_size": page_size
            }
        
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
            "total_count": total_count,
            "page": page,
            "page_size": page_size
        }
    except HTTPException:
        raise
    except Exception as e:
        handle_database_error("get user orders", e)


async def update_order_status(user_id: UUID, order_id: int, new_status: str) -> Dict[str, Any]:
    """
    Update order status. Only accessible to buyer or seller.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        # First verify user has access to this order
        order = await get_order_by_id(user_id, order_id)
        
        # Update the order status
        result = supabase.table("orders").update({
            "status": new_status
        }).eq("order_id", order_id).execute()
        
        validate_record_exists(result.data, "Failed to update order status")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        handle_database_error("update order status", e)


async def update_listing_stock(user_id: UUID, listing_id: int, quantity: int) -> None:
    """
    Update listing stock after an order is placed.
    Also updates sold_count.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        # Get current listing data
        listing_result = supabase.table("listings").select(
            "total_stock,sold_count"
        ).eq("listing_id", listing_id).execute()
        
        validate_record_exists(listing_result.data, "Listing not found")
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
        
        validate_record_exists(result.data, "Failed to update listing stock")
    except HTTPException:
        raise
    except Exception as e:
        handle_database_error("update listing stock", e)
