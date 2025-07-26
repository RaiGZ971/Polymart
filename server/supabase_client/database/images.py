"""
Image-related database operations.
Handles listing images and file references in the database.
"""

from typing import Dict, Any, List, Optional
from fastapi import HTTPException
from .base import get_authenticated_client, handle_database_error, validate_record_exists


async def add_listing_image(user_id: int, listing_id: int, image_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Add an image to a listing.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        # Verify listing ownership
        listing_check = supabase.table("listings").select("seller_id").eq("listing_id", listing_id).execute()
        validate_record_exists(listing_check.data, "Listing not found")
        
        if listing_check.data[0]["seller_id"] != user_id:
            raise HTTPException(status_code=403, detail="You can only add images to your own listings")
        
        # Add listing_id to image data
        image_data["listing_id"] = listing_id
        
        result = supabase.table("listing_images").insert(image_data).execute()
        
        validate_record_exists(result.data, "Failed to add listing image")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        handle_database_error("add listing image", e)


async def get_listing_images(user_id: int, listing_id: int) -> List[Dict[str, Any]]:
    """
    Get all images for a listing.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        result = supabase.table("listing_images").select("""
            image_id,
            listing_id,
            image_url,
            s3_key,
            original_filename,
            file_size,
            content_type,
            is_primary,
            uploaded_at
        """).eq("listing_id", listing_id).order("uploaded_at", desc=False).execute()
        
        return result.data if result.data else []
    except Exception as e:
        handle_database_error("get listing images", e)


async def get_user_listing_images(user_id: int) -> List[Dict[str, Any]]:
    """
    Get all images for user's listings.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        # First get user's listings
        user_listings = supabase.table("listings").select("listing_id").eq("seller_id", user_id).execute()
        
        if not user_listings.data:
            return []
        
        listing_ids = [listing["listing_id"] for listing in user_listings.data]
        
        # Get images for all user listings
        result = supabase.table("listing_images").select("*").in_("listing_id", listing_ids).execute()
        
        return result.data if result.data else []
    except Exception as e:
        handle_database_error("get user listing images", e)


async def update_image_url(user_id: int, image_id: int, new_url: str, s3_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Update image URL and S3 key.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        # Build update data
        update_data = {"image_url": new_url}
        if s3_key:
            update_data["s3_key"] = s3_key
        
        result = supabase.table("listing_images").update(update_data).eq("image_id", image_id).execute()
        
        validate_record_exists(result.data, "Failed to update image URL")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        handle_database_error("update image URL", e)


async def delete_listing_image(user_id: int, image_id: int) -> bool:
    """
    Delete a listing image. Only the listing owner can delete.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        # First verify ownership through listing
        image_result = supabase.table("listing_images").select(
            "image_id,listing_id,listings!inner(seller_id)"
        ).eq("image_id", image_id).execute()
        
        validate_record_exists(image_result.data, "Image not found")
        image = image_result.data[0]
        
        if image["listings"]["seller_id"] != user_id:
            raise HTTPException(status_code=403, detail="You can only delete images from your own listings")
        
        # Delete the image
        result = supabase.table("listing_images").delete().eq("image_id", image_id).execute()
        
        return True
    except HTTPException:
        raise
    except Exception as e:
        handle_database_error("delete listing image", e)


async def set_primary_image(user_id: int, listing_id: int, image_id: int) -> Dict[str, Any]:
    """
    Set an image as the primary image for a listing.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        # Verify listing ownership
        listing_check = supabase.table("listings").select("seller_id").eq("listing_id", listing_id).execute()
        validate_record_exists(listing_check.data, "Listing not found")
        
        if listing_check.data[0]["seller_id"] != user_id:
            raise HTTPException(status_code=403, detail="You can only modify your own listings")
        
        # First, unset all other images as primary for this listing
        supabase.table("listing_images").update({
            "is_primary": False
        }).eq("listing_id", listing_id).execute()
        
        # Set the specified image as primary
        result = supabase.table("listing_images").update({
            "is_primary": True
        }).eq("image_id", image_id).eq("listing_id", listing_id).execute()
        
        validate_record_exists(result.data, "Failed to set primary image")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        handle_database_error("set primary image", e)


async def get_primary_image(user_id: int, listing_id: int) -> Optional[Dict[str, Any]]:
    """
    Get the primary image for a listing.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        result = supabase.table("listing_images").select("*").eq("listing_id", listing_id).eq("is_primary", True).execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0]
        return None
    except Exception as e:
        handle_database_error("get primary image", e)


async def cleanup_orphaned_images(user_id: int) -> int:
    """
    Clean up images that no longer have associated listings.
    Returns the number of images cleaned up.
    """
    try:
        supabase = get_authenticated_client(user_id)
        
        # This would require a more complex query or application logic
        # For now, return 0 as this would typically be an admin operation
        return 0
    except Exception as e:
        handle_database_error("cleanup orphaned images", e)
