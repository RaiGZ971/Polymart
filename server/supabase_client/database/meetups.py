"""
Meetup-related database operations.
Handles meetup creation, updates, and confirmation for orders.
"""

from typing import Dict, Any, Optional
from fastapi import HTTPException
from uuid import UUID
from .base import get_authenticated_client, handle_database_error, validate_record_exists


async def create_meetup(user_id: UUID, order_id: int, meetup_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Create a new meetup record for an order.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        # Default meetup data
        default_data = {
            "order_id": order_id,
            "status": "pending",
            "confirmed_by_buyer": False,
            "confirmed_by_seller": False
        }
        
        # Merge with provided data
        if meetup_data:
            default_data.update(meetup_data)
        
        result = supabase.table("meetups").insert(default_data).execute()
        
        validate_record_exists(result.data, "Failed to create meetup")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        handle_database_error("create meetup", e)


async def get_meetup_by_order(user_id: UUID, order_id: int) -> Optional[Dict[str, Any]]:
    """
    Get meetup details by order ID.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        result = supabase.table("meetups").select("*").eq("order_id", order_id).execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0]
        return None
    except Exception as e:
        handle_database_error("get meetup by order", e)


async def update_meetup(user_id: UUID, order_id: int, update_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update meetup details (location, scheduled_at, etc.).
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        # Add updated timestamp
        update_data["updated_at"] = "now()"
        
        result = supabase.table("meetups").update(update_data).eq("order_id", order_id).execute()
        
        validate_record_exists(result.data, "Meetup not found or failed to update")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        handle_database_error("update meetup", e)


async def confirm_meetup_by_user(user_id: UUID, order_id: int, is_buyer: bool) -> Dict[str, Any]:
    """
    Confirm meetup by buyer or seller.
    When both confirm, meetup status becomes 'confirmed'.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        # Get current meetup status
        meetup_result = supabase.table("meetups").select(
            "confirmed_by_buyer,confirmed_by_seller"
        ).eq("order_id", order_id).execute()
        
        validate_record_exists(meetup_result.data, "Meetup not found")
        meetup = meetup_result.data[0]
        
        # Update confirmation status
        update_data = {}
        if is_buyer:
            update_data["confirmed_by_buyer"] = True
        else:
            update_data["confirmed_by_seller"] = True
        
        # Check if both parties will be confirmed after this update
        both_confirmed = (
            (meetup["confirmed_by_buyer"] or is_buyer) and
            (meetup["confirmed_by_seller"] or not is_buyer)
        )
        
        if both_confirmed:
            update_data["status"] = "confirmed"
            update_data["confirmed_at"] = "now()"
        
        # Update the meetup
        result = supabase.table("meetups").update(update_data).eq("order_id", order_id).execute()
        
        validate_record_exists(result.data, "Failed to confirm meetup")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        handle_database_error("confirm meetup", e)


async def get_meetup_details(user_id: UUID, meetup_id: int) -> Dict[str, Any]:
    """
    Get detailed meetup information by meetup ID.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        result = supabase.table("meetups").select("*").eq("meetup_id", meetup_id).execute()
        
        validate_record_exists(result.data, "Meetup not found")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        handle_database_error("get meetup details", e)


async def cancel_meetup(user_id: UUID, order_id: int, cancellation_reason: Optional[str] = None) -> Dict[str, Any]:
    """
    Cancel a meetup and update its status.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        update_data = {
            "status": "cancelled",
            "cancelled_at": "now()",
            "updated_at": "now()"
        }
        
        if cancellation_reason:
            update_data["cancellation_reason"] = cancellation_reason
        
        result = supabase.table("meetups").update(update_data).eq("order_id", order_id).execute()
        
        validate_record_exists(result.data, "Failed to cancel meetup")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        handle_database_error("cancel meetup", e)


async def get_meetup_by_order_id(user_id: UUID, order_id: int) -> Dict[str, Any]:
    """
    Get meetup details by order ID.
    Raises HTTPException if meetup not found.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        result = supabase.table("meetups").select("*").eq("order_id", order_id).execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(status_code=404, detail="Meetup not found for this order")
        
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        handle_database_error("get meetup by order ID", e)


async def create_meetup_with_details(user_id: UUID, order_id: int, meetup_details: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a new meetup record with initial details (location, scheduled_at, remarks).
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        # Prepare meetup data with details
        meetup_data = {
            "order_id": order_id,
            "status": "pending",
            "confirmed_by_buyer": False,
            "confirmed_by_seller": False,
            "location": meetup_details.get("location"),
            "scheduled_at": meetup_details.get("scheduled_at"),
            "remarks": meetup_details.get("remarks")
        }
        
        result = supabase.table("meetups").insert(meetup_data).execute()
        
        validate_record_exists(result.data, "Failed to create meetup")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        handle_database_error("create meetup with details", e)
