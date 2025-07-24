"""
Order-related routes for the Supabase client.
Handles order operations including creation, retrieval, and status updates.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from supabase_client.schemas import (
    CreateOrderRequest, CreateOrderResponse, Order, OrdersResponse
)
from supabase_client.utils import (
    get_supabase_client, validate_order_transaction_method, validate_order_payment_method,
    check_listing_availability, create_order_record, get_order_by_id,
    convert_order_to_response, update_listing_stock, get_user_orders,
    convert_orders_to_response, calculate_pagination_offset
)
from auth.utils import get_current_user
from core.utils import create_standardized_response

router = APIRouter()

@router.post("/orders", response_model=CreateOrderResponse)
async def create_order(
    order_request: CreateOrderRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new order for a product listing.
    Validates listing availability, stock, and order requirements.
    """
    try:
        # Validate payment and transaction methods
        validate_order_transaction_method(order_request.transaction_method)
        validate_order_payment_method(order_request.payment_method)
        
        # Get authenticated client
        supabase = get_supabase_client(current_user["user_id"])
        
        # Check listing availability and get listing details
        listing = await check_listing_availability(
            supabase, 
            order_request.listing_id, 
            order_request.quantity, 
            current_user["user_id"]
        )
        
        # Calculate price at purchase (use price_min as the purchase price)
        price_at_purchase = listing.get("price_min")
        if not price_at_purchase:
            raise HTTPException(
                status_code=400, 
                detail="Listing does not have a valid price"
            )
        
        # Create the order record
        order_data = await create_order_record(
            supabase=supabase,
            buyer_id=current_user["user_id"],
            seller_id=listing["seller_id"],
            listing_id=order_request.listing_id,
            quantity=order_request.quantity,
            price_at_purchase=float(price_at_purchase),
            transaction_method=order_request.transaction_method,
            payment_method=order_request.payment_method
        )
        
        # Update listing stock
        await update_listing_stock(
            supabase, 
            order_request.listing_id, 
            order_request.quantity
        )
        
        # Convert to response format
        order_response = await convert_order_to_response(supabase, order_data)
        
        return CreateOrderResponse(
            success=True,
            message="Order created successfully",
            data=order_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating order: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to create order: {str(e)}"
        )

@router.get("/orders", response_model=OrdersResponse)
async def get_user_orders(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Number of items per page"),
    status: Optional[str] = Query(None, description="Filter by order status"),
    as_buyer: Optional[bool] = Query(None, description="Get orders as buyer (True) or seller (False)"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get user's orders - both as buyer and seller.
    Supports pagination and filtering by status and role.
    """
    try:
        # Get authenticated client
        supabase = get_supabase_client(current_user["user_id"])
        
        # Get user orders with pagination and filters
        orders_data = await get_user_orders(
            supabase=supabase,
            user_id=current_user["user_id"],
            page=page,
            page_size=page_size,
            status=status,
            as_buyer=as_buyer
        )
        
        # Convert to response format
        orders_response = await convert_orders_to_response(supabase, orders_data["orders"])
        
        return OrdersResponse(
            orders=orders_response,
            total_count=orders_data["total_count"],
            page=page,
            page_size=page_size
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting user orders: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to get orders: {str(e)}"
        )

@router.get("/orders/{order_id}", response_model=Order)
async def get_order_details(
    order_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Get details of a specific order.
    Only accessible to the buyer or seller of the order.
    """
    try:
        # Get authenticated client
        supabase = get_supabase_client(current_user["user_id"])
        
        # Get order by ID
        order_data = await get_order_by_id(
            supabase, 
            order_id, 
            current_user["user_id"]
        )
        
        # Convert to response format
        order_response = await convert_order_to_response(supabase, order_data)
        
        return order_response
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting order details: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to get order details: {str(e)}"
        )
