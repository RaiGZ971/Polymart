"""
Meetup-related database operations.
Handles meetup creation, updates, and confirmation for orders.
"""

from typing import Dict, Any, Optional
from fastapi import HTTPException
from uuid import UUID
from .base import get_authenticated_client, handle_database_error, validate_record_exists


async def get_meetup_history(user_id: UUID, order_id: int) -> list[Dict[str, Any]]:
    """
    Get all meetup versions (history) for an order.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        result = supabase.table("meetups").select("*").eq("order_id", order_id).order("changed_at", desc=True).execute()
        
        return result.data or []
    except Exception as e:
        handle_database_error("get meetup history", e)


async def create_meetup(user_id: UUID, order_id: int, meetup_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Create a new meetup record for an order.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        # Default meetup data matching schema
        default_data = {
            "order_id": order_id,
            "status": "pending",
            "proposed_by": "buyer",  # Default from schema
            "confirmed_by_buyer": True,  # Default from schema 
            "confirmed_by_seller": None,  # Default from schema
            "is_current": True  # Required by schema
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
    Get current meetup details by order ID.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        result = supabase.table("meetups").select("*").eq("order_id", order_id).eq("is_current", True).execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0]
        return None
    except Exception as e:
        handle_database_error("get meetup by order", e)


async def update_meetup(user_id: UUID, order_id: int, update_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update meetup details (location, scheduled_at, etc.).
    For significant changes like rescheduling, this creates a new version.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        # Check if this is a reschedule (scheduled_at change)
        is_reschedule = "scheduled_at" in update_data
        
        if is_reschedule:
            # For reschedules, mark current meetup as not current and create new one
            # First, mark existing meetup as not current
            supabase.table("meetups").update({
                "is_current": False,
                "changed_at": "now()"
            }).eq("order_id", order_id).eq("is_current", True).execute()
            
            # Get the existing meetup data
            existing_result = supabase.table("meetups").select("*").eq("order_id", order_id).eq("is_current", False).order("changed_at", desc=True).limit(1).execute()
            
            if existing_result.data:
                existing_meetup = existing_result.data[0]
                
                # Create new meetup version with updated data
                new_meetup_data = {
                    "order_id": order_id,
                    "location": update_data.get("location", existing_meetup.get("location")),
                    "scheduled_at": update_data.get("scheduled_at", existing_meetup["scheduled_at"]),
                    "status": "rescheduled" if is_reschedule else existing_meetup["status"],
                    "remarks": update_data.get("remarks", existing_meetup.get("remarks")),
                    "proposed_by": update_data.get("proposed_by", existing_meetup["proposed_by"]),
                    "confirmed_by_buyer": existing_meetup.get("confirmed_by_buyer"),
                    "confirmed_by_seller": existing_meetup.get("confirmed_by_seller"),
                    "is_current": True
                }
                
                result = supabase.table("meetups").insert(new_meetup_data).execute()
                validate_record_exists(result.data, "Failed to create rescheduled meetup")
                return result.data[0]
            else:
                raise HTTPException(status_code=404, detail="No existing meetup found to reschedule")
        else:
            # For non-reschedule updates, update in place and set changed_at
            update_data["changed_at"] = "now()"
            
            result = supabase.table("meetups").update(update_data).eq("order_id", order_id).eq("is_current", True).execute()
            
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
        ).eq("order_id", order_id).eq("is_current", True).execute()
        
        validate_record_exists(meetup_result.data, "Current meetup not found")
        meetup = meetup_result.data[0]
        
        # Update confirmation status
        update_data = {"changed_at": "now()"}
        if is_buyer:
            update_data["confirmed_by_buyer"] = True
        else:
            update_data["confirmed_by_seller"] = True
        
        # Check if both parties will be confirmed after this update
        both_confirmed = (
            (meetup.get("confirmed_by_buyer") or is_buyer) and
            (meetup.get("confirmed_by_seller") or not is_buyer)
        )
        
        if both_confirmed:
            update_data["status"] = "confirmed"
        
        # Update the current meetup
        result = supabase.table("meetups").update(update_data).eq("order_id", order_id).eq("is_current", True).execute()
        
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
            "changed_at": "now()"
        }
        
        # Use remarks field for cancellation reason since that's what exists in schema
        if cancellation_reason:
            update_data["remarks"] = cancellation_reason
        
        result = supabase.table("meetups").update(update_data).eq("order_id", order_id).eq("is_current", True).execute()
        
        validate_record_exists(result.data, "Failed to cancel meetup")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        handle_database_error("cancel meetup", e)


async def get_meetup_by_order_id(user_id: UUID, order_id: int) -> Dict[str, Any]:
    """
    Get current meetup details by order ID.
    Raises HTTPException if meetup not found.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        result = supabase.table("meetups").select("*").eq("order_id", order_id).eq("is_current", True).execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(status_code=404, detail="Current meetup not found for this order")
        
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
        
        # Prepare meetup data with details matching schema
        meetup_data = {
            "order_id": order_id,
            "status": "pending",
            "proposed_by": meetup_details.get("proposed_by", "buyer"),  # Default to buyer
            "confirmed_by_buyer": True,  # Schema default
            "confirmed_by_seller": None,  # Schema default
            "is_current": True,  # Required by schema
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
