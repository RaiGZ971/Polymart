"""
Order-related routes for the Supabase client.
Handles order operations including creation, retrieval, and status updates.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from supabase_client.schemas import (
    CreateOrderRequest, CreateOrderResponse, Order, OrdersResponse,
    UpdateMeetupRequest, CreateMeetupRequest, MeetupResponse,
    UpdateOrderStatusRequest, UpdateOrderStatusResponse
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
        
        # Check for existing pending orders
        has_pending_order = await order_db.check_existing_pending_orders(
            current_user["user_id"], 
            order_request.listing_id
        )
        
        if has_pending_order:
            raise HTTPException(
                status_code=409,  # Conflict status
                detail="You already have a pending order for this product. Please wait for the current order to be processed or cancel it before placing a new one."
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
        
        # Create the order record (price_at_purchase will be set when order is completed)
        order_data = await order_db.create_order(
            user_id=current_user["user_id"],
            order_data={
                "buyer_id": current_user["user_id"],
                "seller_id": listing["seller_id"],
                "listing_id": order_request.listing_id,
                "quantity": order_request.quantity,
                "transaction_method": order_request.transaction_method,
                "payment_method": order_request.payment_method,
                "buyer_requested_price": order_request.buyer_requested_price
            }
        )
        
        # Update stock immediately when order is placed (even if pending)
        # This prevents overselling and provides real-time inventory updates
        try:
            await order_db.update_listing_stock(
                user_id=current_user["user_id"],
                listing_id=order_request.listing_id,
                quantity=order_request.quantity
            )
        except Exception as stock_error:
            # If stock update fails, we should clean up the created order
            # This is a critical error that should not happen if validation passed
            print(f"Critical error: Stock update failed after order creation: {stock_error}")
            # In a production system, you might want to implement compensation logic here
            raise HTTPException(
                status_code=500,
                detail="Failed to update inventory. Order creation aborted."
            )
        
        # Note: Meetup creation is now handled separately via POST /orders/{order_id}/meetup
        
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
    status: Optional[str] = Query(None, description="Filter by order status"),
    as_buyer: Optional[bool] = Query(None, description="Get orders as buyer (True) or seller (False)"),
    page: int = Query(1, description="Page number"),
    page_size: int = Query(20, description="Number of items per page"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get user's orders - both as buyer and seller.
    Supports filtering by status and role.
    """
    try:
        # Get user orders with filters
        orders_data = await order_db.get_user_orders(
            user_id=current_user["user_id"],
            page=page,
            page_size=page_size,
            status=status,
            as_buyer=as_buyer
        )
        
        # Convert to response format
        supabase = get_authenticated_client(current_user["user_id"])
        orders_response = await convert_orders_to_response(supabase, orders_data["orders"], current_user["user_id"])
        
        return OrdersResponse(
            orders=orders_response,
            total_count=orders_data["total_count"],
            page=orders_data["page"],
            page_size=orders_data["page_size"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting user orders: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to get orders: {str(e)}"
        )


@router.get("/orders/check-pending/{listing_id}")
async def check_pending_order_for_listing(
    listing_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Check if user has a pending order for a specific listing.
    """
    try:
        has_pending = await order_db.check_existing_pending_orders(
            current_user["user_id"], 
            listing_id
        )
        
        return {
            "has_pending_order": has_pending,
            "listing_id": listing_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error checking pending orders: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to check pending orders: {str(e)}"
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

@router.patch("/orders/{order_id}/status", response_model=UpdateOrderStatusResponse)
async def update_order_status(
    order_id: int,
    request: UpdateOrderStatusRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Update the status of an order.
    Only accessible to the buyer or seller of the order.
    Valid status values: 'pending', 'confirmed', 'completed', 'cancelled'
    """
    try:
        status = request.status
        
        # Validate status against database schema
        valid_statuses = ['pending', 'confirmed', 'completed', 'cancelled']
        if status not in valid_statuses:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            )
        
        # Get order to verify user has access
        order_data = await order_db.get_order_by_id(current_user["user_id"], order_id)
        
        # Determine if user is buyer or seller
        is_buyer = order_data["buyer_id"] == current_user["user_id"]
        is_seller = order_data["seller_id"] == current_user["user_id"]
        
        # Business logic for status transitions based on database schema
        # Valid statuses: 'pending', 'confirmed', 'completed', 'cancelled'
        current_status = order_data.get("status", "").lower()
        
        # Status transition rules:
        # pending -> confirmed (seller only)
        # pending -> cancelled (buyer or seller)
        # confirmed -> completed (seller only) 
        # confirmed -> cancelled (buyer or seller)
        
        if status == "confirmed":
            if not is_seller:
                raise HTTPException(
                    status_code=403,
                    detail="Only sellers can confirm orders"
                )
            if current_status != "pending":
                raise HTTPException(
                    status_code=400,
                    detail="Only pending orders can be confirmed"
                )
        
        elif status == "completed":
            if not is_seller:
                raise HTTPException(
                    status_code=403,
                    detail="Only sellers can mark orders as completed"
                )
            if current_status != "confirmed":
                raise HTTPException(
                    status_code=400,
                    detail="Only confirmed orders can be completed"
                )
        
        elif status == "cancelled":
            if not (is_buyer or is_seller):
                raise HTTPException(
                    status_code=403,
                    detail="Only order participants can cancel orders"
                )
            if current_status == "completed":
                raise HTTPException(
                    status_code=400,
                    detail="Completed orders cannot be cancelled"
                )
        
        elif status == "pending":
            # Generally, orders shouldn't go back to pending
            raise HTTPException(
                status_code=400,
                detail="Orders cannot be reverted to pending status"
            )
        
        # Update order status in database
        updated_order = await order_db.update_order_status(
            current_user["user_id"], 
            order_id, 
            status
        )
        
        # Handle stock restoration for cancelled orders
        if status == "cancelled":
            # Restore stock when order is cancelled
            await order_db.restore_listing_stock(
                user_id=current_user["user_id"],
                listing_id=order_data["listing_id"],
                quantity=order_data["quantity"]
            )
        
        # Handle setting listing to sold_out when order is completed
        elif status == "completed":
            # Set the final price when order is completed
            await order_db.set_order_completion_price(
                user_id=current_user["user_id"],
                order_id=order_id
            )
            
            # Set listing to sold_out if it was inactive due to 0 stock
            await order_db.set_listing_sold_out(
                user_id=current_user["user_id"],
                listing_id=order_data["listing_id"]
            )
        
        # Convert to response format
        supabase = get_authenticated_client(current_user["user_id"])
        order_response = await convert_order_to_response(supabase, updated_order)
        
        return UpdateOrderStatusResponse(
            success=True,
            message=f"Order status updated to {status}",
            data=order_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating order status: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update order status: {str(e)}"
        )

@router.patch("/orders/{order_id}/meetup", response_model=MeetupResponse)
async def update_meetup_details(
    order_id: int,
    meetup_update: UpdateMeetupRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Update meetup details - DUAL-PURPOSE ENDPOINT:
    
    **RESCHEDULING** (includes `scheduled_at`):
    - Creates NEW meetup record with `status="rescheduled"`
    - Marks old record as `is_current=false`
    
    **REGULAR UPDATES** (no `scheduled_at`):
    - Updates current record in-place (location, remarks)
    
    Only accessible to buyer or seller of the order.
    """
    try:
        # Verify user has access to this order
        order_data = await order_db.get_order_by_id(current_user["user_id"], order_id)
        
        # Check if order has meetup transaction method
        if order_data["transaction_method"] != "Meet-up":
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
        if meetup_update.remarks is not None:
            update_data["remarks"] = meetup_update.remarks
        
        # Handle proposed_by field - determine who is making the update if not provided
        if meetup_update.proposed_by is not None:
            update_data["proposed_by"] = meetup_update.proposed_by
        elif meetup_update.scheduled_at is not None:  # Only set for rescheduling
            is_buyer = order_data["buyer_id"] == current_user["user_id"]
            update_data["proposed_by"] = "buyer" if is_buyer else "seller"
        
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
            remarks=meetup_data.get("remarks"),
            proposed_by=meetup_data["proposed_by"],
            confirmed_by_buyer=meetup_data.get("confirmed_by_buyer"),
            confirmed_by_seller=meetup_data.get("confirmed_by_seller"),
            changed_at=meetup_data["changed_at"],
            is_current=meetup_data["is_current"]
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
    Confirm current meetup by buyer or seller.
    Updates `confirmed_by_buyer` or `confirmed_by_seller`.
    When both confirm → `status="confirmed"`.
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
            remarks=meetup_data.get("remarks"),
            proposed_by=meetup_data["proposed_by"],
            confirmed_by_buyer=meetup_data.get("confirmed_by_buyer"),
            confirmed_by_seller=meetup_data.get("confirmed_by_seller"),
            changed_at=meetup_data["changed_at"],
            is_current=meetup_data["is_current"]
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
    Create initial meetup for an order with 'Meet-up' transaction method.
    Creates new record with `status="pending"`, `is_current=true`.
    Only accessible to buyer or seller of the order.
    """
    try:
        # Verify user has access to this order and check transaction method
        order_data = await order_db.get_order_by_id(current_user["user_id"], order_id)
        
        # Check if order uses meetup transaction method
        if order_data["transaction_method"] != "Meet-up":
            raise HTTPException(
                status_code=400,
                detail="Meetup can only be created for orders with 'Meet-up' transaction method"
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
        
        # Determine who is proposing the meetup
        is_buyer = order_data["buyer_id"] == current_user["user_id"]
        proposed_by = meetup_request.proposed_by or ("buyer" if is_buyer else "seller")
        
        # Create the meetup record
        meetup_data = await meetup_db.create_meetup_with_details(
            user_id=current_user["user_id"],
            order_id=order_id,
            meetup_details={
                "location": meetup_request.location,
                "scheduled_at": meetup_request.scheduled_at.isoformat(),
                "remarks": meetup_request.remarks,
                "proposed_by": proposed_by
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
            remarks=meetup_data.get("remarks"),
            proposed_by=meetup_data["proposed_by"],
            confirmed_by_buyer=meetup_data.get("confirmed_by_buyer"),
            confirmed_by_seller=meetup_data.get("confirmed_by_seller"),
            changed_at=meetup_data["changed_at"],
            is_current=meetup_data["is_current"]
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


@router.get("/orders/{order_id}/meetup/history", response_model=list)
async def get_meetup_history(
    order_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Get all meetup versions for an order (newest first).
    Shows complete reschedule history with `is_current` flags.
    """
    try:
        # Verify user has access to this order
        order_data = await order_db.get_order_by_id(current_user["user_id"], order_id)
        
        # Get all meetup versions for this order
        supabase = get_authenticated_client(current_user["user_id"])
        result = supabase.table("meetups").select("*").eq("order_id", order_id).order("changed_at", desc=True).execute()
        
        meetups = []
        for meetup_data in result.data:
            from supabase_client.schemas import Meetup
            meetup = Meetup(
                meetup_id=meetup_data["meetup_id"],
                order_id=meetup_data["order_id"],
                location=meetup_data.get("location"),
                scheduled_at=meetup_data["scheduled_at"],
                status=meetup_data["status"],
                remarks=meetup_data.get("remarks"),
                proposed_by=meetup_data["proposed_by"],
                confirmed_by_buyer=meetup_data.get("confirmed_by_buyer"),
                confirmed_by_seller=meetup_data.get("confirmed_by_seller"),
                changed_at=meetup_data["changed_at"],
                is_current=meetup_data["is_current"]
            )
            meetups.append(meetup)
        
        return meetups
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting meetup history: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get meetup history: {str(e)}"
        )


@router.patch("/orders/{order_id}/meetup/cancel")
async def cancel_meetup(
    order_id: int,
    cancellation_reason: str = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Cancel the current meetup for an order.
    """
    try:
        # Verify user has access to this order
        order_data = await order_db.get_order_by_id(current_user["user_id"], order_id)
        
        # Cancel meetup using database function
        meetup_data = await meetup_db.cancel_meetup(current_user["user_id"], order_id, cancellation_reason)
        
        # Convert to proper response format
        from supabase_client.schemas import Meetup
        meetup = Meetup(
            meetup_id=meetup_data["meetup_id"],
            order_id=meetup_data["order_id"],
            location=meetup_data.get("location"),
            scheduled_at=meetup_data["scheduled_at"],
            status=meetup_data["status"],
            remarks=meetup_data.get("remarks"),
            proposed_by=meetup_data["proposed_by"],
            confirmed_by_buyer=meetup_data.get("confirmed_by_buyer"),
            confirmed_by_seller=meetup_data.get("confirmed_by_seller"),
            changed_at=meetup_data["changed_at"],
            is_current=meetup_data["is_current"]
        )
        
        return MeetupResponse(
            success=True,
            status="success",
            message="Meetup cancelled successfully",
            data=meetup
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error cancelling meetup: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to cancel meetup: {str(e)}"
        )
