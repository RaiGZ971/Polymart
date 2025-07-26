"""
Order-related routes for the Supabase client.
Handles order operations including creation, retrieval, and status updates.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from supabase_client.schemas import (
    CreateOrderRequest, CreateOrderResponse, Order, OrdersResponse,
    UpdateMeetupRequest, MeetupResponse
)
from supabase_client.utils import (
    get_supabase_client, validate_order_transaction_method, validate_order_payment_method,
    check_listing_availability, create_order_record, get_order_by_id,
    convert_order_to_response, update_listing_stock, get_user_orders,
    convert_orders_to_response, calculate_pagination_offset, create_meetup_record
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
        order_data = await create_order_record(
            supabase=supabase,
            buyer_id=current_user["user_id"],
            seller_id=listing["seller_id"],
            listing_id=order_request.listing_id,
            quantity=order_request.quantity,
            price_at_purchase=float(price_at_purchase),
            transaction_method=order_request.transaction_method,
            payment_method=order_request.payment_method,
            buyer_requested_price=order_request.buyer_requested_price
        )
        
        # Create meetup record if transaction method is "meet_up"
        if order_request.transaction_method == "meet_up":
            await create_meetup_record(
                supabase=supabase,
                order_id=order_data["order_id"]
            )
        
        # Note: Stock is NOT updated here since order is still "pending"
        # Stock should only be updated when order status changes to "confirmed" or "completed"
        
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
        # Get authenticated client
        supabase = get_supabase_client(current_user["user_id"])
        
        # Verify user has access to this order
        order_data = await get_order_by_id(supabase, order_id, current_user["user_id"])
        
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
        
        result = supabase.table("meetups").update(update_data).eq("order_id", order_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Meetup not found")
        
        # Convert to proper response format
        from supabase_client.schemas import Meetup
        meetup_data = result.data[0]
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
        # Get authenticated client
        supabase = get_supabase_client(current_user["user_id"])
        
        # Verify user has access to this order
        order_data = await get_order_by_id(supabase, order_id, current_user["user_id"])
        
        # Determine if user is buyer or seller
        is_buyer = order_data["buyer_id"] == current_user["user_id"]
        is_seller = order_data["seller_id"] == current_user["user_id"]
        
        # Update confirmation status
        update_data = {}
        if is_buyer:
            update_data["confirmed_by_buyer"] = True
        elif is_seller:
            update_data["confirmed_by_seller"] = True
        
        # Get current meetup status
        meetup_result = supabase.table("meetups").select(
            "confirmed_by_buyer,confirmed_by_seller"
        ).eq("order_id", order_id).execute()
        
        if not meetup_result.data:
            raise HTTPException(status_code=404, detail="Meetup not found")
        
        meetup = meetup_result.data[0]
        
        # Check if both parties will be confirmed after this update
        both_confirmed = (
            (meetup["confirmed_by_buyer"] or is_buyer) and
            (meetup["confirmed_by_seller"] or is_seller)
        )
        
        if both_confirmed:
            update_data["status"] = "confirmed"
            update_data["confirmed_at"] = "now()"
        
        result = supabase.table("meetups").update(update_data).eq("order_id", order_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to confirm meetup")
        
        # Convert to proper response format
        from supabase_client.schemas import Meetup
        meetup_data = result.data[0]
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
        if both_confirmed:
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
