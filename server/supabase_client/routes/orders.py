"""
Order-related routes for the Supabase client.
Handles order operations including creation, retrieval, and status updates.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from supabase_client.schemas import (
    CreateOrderRequest, CreateOrderResponse, Order, OrdersResponse,
    UpdateMeetupRequest, CreateMeetupRequest, MeetupResponse
)
from supabase_client.database import orders as order_db, meetups as meetup_db
from supabase_client.database.base import get_authenticated_client
from supabase_client.utils import (
    validate_order_transaction_method, validate_order_payment_method,
    validate_order_against_listing_methods,
    convert_order_to_response, convert_orders_to_response
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
        
        # Check listing availability and get listing details
        listing = await order_db.check_listing_availability(
            current_user["user_id"], 
            order_request.listing_id, 
            order_request.quantity, 
            current_user["user_id"]
        )
        
        # Validate that the selected transaction and payment methods are available in the listing
        validate_order_against_listing_methods(
            order_request.transaction_method,
            order_request.payment_method,
            listing.get("transaction_methods", []),
            listing.get("payment_methods", [])
        )
        
        # Validate buyer_requested_price usage
        has_price_range = (
            listing.get("price_min") is not None and 
            listing.get("price_max") is not None and 
            listing["price_min"] != listing["price_max"]
        )
        
        if order_request.buyer_requested_price is not None:
            if not has_price_range:
                raise HTTPException(
                    status_code=400,
                    detail="buyer_requested_price can only be used for listings with price ranges (different price_min and price_max)"
                )
            
            # Validate that buyer_requested_price is within the listing's price range
            if (order_request.buyer_requested_price < listing["price_min"] or 
                order_request.buyer_requested_price > listing["price_max"]):
                raise HTTPException(
                    status_code=400,
                    detail=f"buyer_requested_price must be between {listing['price_min']} and {listing['price_max']}"
                )
        
        # Calculate price at purchase (use price_min as the purchase price)
        price_at_purchase = listing.get("price_min")
        if not price_at_purchase:
            raise HTTPException(
                status_code=400, 
                detail="Listing does not have a valid price"
            )
        
        # Create the order record
        order_data = await order_db.create_order(
            user_id=current_user["user_id"],
            order_data={
                "buyer_id": current_user["user_id"],
                "seller_id": listing["seller_id"],
                "listing_id": order_request.listing_id,
                "quantity": order_request.quantity,
                "price_at_purchase": float(price_at_purchase),
                "transaction_method": order_request.transaction_method,
                "payment_method": order_request.payment_method,
                "buyer_requested_price": order_request.buyer_requested_price
            }
        )
        
        # Note: Meetup creation is now handled separately via POST /orders/{order_id}/meetup
        # Note: Stock is NOT updated here since order is still "pending"
        # Stock should only be updated when order status changes to "confirmed" or "completed"
        
        # Convert to response format
        supabase = get_authenticated_client(current_user["user_id"])
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
        # Get user orders with pagination and filters
        orders_data = await order_db.get_user_orders(
            user_id=current_user["user_id"],
            page=page,
            page_size=page_size,
            status=status,
            as_buyer=as_buyer
        )
        
        # Convert to response format
        supabase = get_authenticated_client(current_user["user_id"])
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
        # Get order by ID
        order_data = await order_db.get_order_by_id(
            current_user["user_id"], 
            order_id
        )
        
        # Convert to response format
        supabase = get_authenticated_client(current_user["user_id"])
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

@router.patch("/orders/{order_id}/meetup", response_model=MeetupResponse)
async def update_meetup_details(
    order_id: int,
    meetup_update: UpdateMeetupRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Update meetup details for an order (location, scheduled_at).
    Only accessible to buyer or seller of the order.
    """
    try:
        # Verify user has access to this order
        order_data = await order_db.get_order_by_id(current_user["user_id"], order_id)
        
        # Check if order has meetup transaction method
        if order_data["transaction_method"] != "meet_up":
            raise HTTPException(
                status_code=400,
                detail="This order does not use meetup transaction method"
            )
        
        # Build update data from the request model
        update_data = {}
        if meetup_update.location is not None:
            update_data["location"] = meetup_update.location
        if meetup_update.scheduled_at is not None:
            update_data["scheduled_at"] = meetup_update.scheduled_at.isoformat()
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No valid fields to update")
        
        # Update meetup using database function
        meetup_data = await meetup_db.update_meetup(current_user["user_id"], order_id, update_data)
        
        # Convert to proper response format
        from supabase_client.schemas import Meetup
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
        
        return MeetupResponse(
            success=True,
            status="success",
            message="Meetup details updated successfully",
            data=meetup
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating meetup details: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update meetup details: {str(e)}"
        )

@router.patch("/orders/{order_id}/meetup/confirm", response_model=MeetupResponse)
async def confirm_meetup(
    order_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Confirm meetup by buyer or seller.
    When both confirm, meetup status becomes 'confirmed'.
    """
    try:
        # Verify user has access to this order
        order_data = await order_db.get_order_by_id(current_user["user_id"], order_id)
        
        # Determine if user is buyer or seller
        is_buyer = order_data["buyer_id"] == current_user["user_id"]
        is_seller = order_data["seller_id"] == current_user["user_id"]
        
        # Confirm meetup using database function
        meetup_data = await meetup_db.confirm_meetup_by_user(current_user["user_id"], order_id, is_buyer)
        
        # Convert to proper response format
        from supabase_client.schemas import Meetup
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
        
        message = "Meetup confirmed by buyer" if is_buyer else "Meetup confirmed by seller"
        if meetup_data["status"] == "confirmed":
            message = "Meetup confirmed by both parties"
        
        return MeetupResponse(
            success=True,
            status="success",
            message=message,
            data=meetup
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error confirming meetup: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to confirm meetup: {str(e)}"
        )


@router.post("/orders/{order_id}/meetup", response_model=MeetupResponse)
async def create_meetup(
    order_id: int,
    meetup_request: CreateMeetupRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a meetup for an order that uses 'meet_up' transaction method.
    Only accessible to buyer or seller of the order.
    """
    try:
        # Verify user has access to this order and check transaction method
        order_data = await order_db.get_order_by_id(current_user["user_id"], order_id)
        
        # Check if order uses meetup transaction method
        if order_data["transaction_method"] != "meet_up":
            raise HTTPException(
                status_code=400,
                detail="Meetup can only be created for orders with 'meet_up' transaction method"
            )
        
        # Check if meetup already exists
        try:
            existing_meetup = await meetup_db.get_meetup_by_order_id(current_user["user_id"], order_id)
            if existing_meetup:
                raise HTTPException(
                    status_code=400,
                    detail="Meetup already exists for this order. Use PATCH to update it."
                )
        except HTTPException as e:
            # If error is "Meetup not found", that's what we want - continue
            if "not found" not in str(e.detail).lower():
                raise
        
        # Create the meetup record
        meetup_data = await meetup_db.create_meetup_with_details(
            user_id=current_user["user_id"],
            order_id=order_id,
            meetup_details={
                "location": meetup_request.location,
                "scheduled_at": meetup_request.scheduled_at.isoformat(),
                "remarks": meetup_request.remarks
            }
        )
        
        # Convert to proper response format
        from supabase_client.schemas import Meetup
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
        
        return MeetupResponse(
            success=True,
            status="success",
            message="Meetup created successfully",
            data=meetup
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating meetup: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create meetup: {str(e)}"
        )
