"""
Listing-related routes for the Supabase client.
Handles product listing operations including CRUD and filtering.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from supabase_client.schemas import (
    ProductListingsResponse, ProductListing, CreateListingRequest, CreateListingResponse,
    UpdateListingStatusRequest, UpdateListingStatusResponse
)
from supabase_client.database import listings as listings_db
from supabase_client.database.base import get_authenticated_client
from supabase_client.utils import (
    validate_category, validate_status, validate_price_range,
    validate_listing_transaction_methods, validate_listing_payment_methods,
    convert_listings_to_products, convert_listing_to_product
)
from auth.utils import get_current_user
from core.utils import create_standardized_response

router = APIRouter()

@router.get("/listings", response_model=ProductListingsResponse)
async def get_product_listings(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Number of items per page"),
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search in product name and description"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price filter"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price filter"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get all product listings excluding the ones owned by the current user.
    Supports pagination, filtering, and search.
    """
    try:
        # Validate parameters
        validate_category(category)
        
        # Get public listings using database function
        listings_data = await listings_db.get_public_listings(
            user_id=current_user["user_id"],
            page=page,
            page_size=page_size,
            category=category,
            search=search,
            min_price=min_price,
            max_price=max_price
        )
        
        if not listings_data["listings"]:
            return ProductListingsResponse(
                products=[],
                total_count=0,
                page=page,
                page_size=page_size
            )
        
        # Convert listings to products
        supabase = get_authenticated_client(current_user["user_id"])
        products = await convert_listings_to_products(supabase, listings_data["listings"])
        
        return ProductListingsResponse(
            products=products,
            total_count=listings_data["total_count"],
            page=page,
            page_size=page_size
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching product listings: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch product listings: {str(e)}")

@router.get("/listings/my-listings", response_model=ProductListingsResponse)
async def get_my_listings(
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search in product name and description"),
    status: Optional[str] = Query(None, description="Filter by status (active, inactive, sold_out, archived)"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get the current user's own product listings. Returns all listings without pagination.
    """
    try:
        # Validate parameters
        validate_category(category)
        validate_status(status)

        # Get user's listings using database function
        listings_data = await listings_db.get_user_listings(
            user_id=current_user["user_id"],
            category=category,
            search=search,
            status=status
        )

        if not listings_data:
            return ProductListingsResponse(
                products=[],
                total_count=0,
                page=1,
                page_size=0
            )

        # Convert listings to products
        supabase = get_authenticated_client(current_user["user_id"])
        products = await convert_listings_to_products(supabase, listings_data)

        return ProductListingsResponse(
            products=products,
            total_count=len(products),
            page=1,
            page_size=len(products)
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching user's listings: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch user's listings: {str(e)}")

@router.get("/listings/{listing_id}", response_model=ProductListing)
async def get_product_by_id(
    listing_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Get a specific product listing by ID (including user's own products)
    """
    try:
        # Get listing by ID using database function
        listing = await listings_db.get_listing_by_id(
            user_id=current_user["user_id"],
            listing_id=listing_id,
            include_seller_info=True
        )
        
        if not listing:
            raise HTTPException(status_code=404, detail="Product not found or not accessible")
        
        # Convert to product object
        supabase = get_authenticated_client(current_user["user_id"])
        product = await convert_listing_to_product(supabase, listing)
        
        return product
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching product: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch product: {str(e)}")

@router.post("/listings", response_model=CreateListingResponse)
async def create_listing(
    listing_data: CreateListingRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new product listing for the current user.
    """
    try:
        # Validate parameters
        validate_category(listing_data.category)
        validate_price_range(listing_data.price_min, listing_data.price_max)
        validate_listing_transaction_methods(listing_data.transaction_methods)
        validate_listing_payment_methods(listing_data.payment_methods)
        
        # Prepare listing data for insertion
        listing_insert_data = {
            "name": listing_data.name,
            "description": listing_data.description,
            "category": listing_data.category,
            "tags": listing_data.tags,
            "price_min": listing_data.price_min,
            "price_max": listing_data.price_max,
            "total_stock": listing_data.total_stock,
            "seller_meetup_locations": listing_data.seller_meetup_locations,
            "transaction_methods": listing_data.transaction_methods,
            "payment_methods": listing_data.payment_methods
        }
        
        # Create the listing using database function
        created_listing = await listings_db.create_listing(current_user["user_id"], listing_insert_data)
        listing_id = created_listing["listing_id"]
        
        # Insert meetup time slots if provided
        if listing_data.meetup_time_slots:
            meetup_time_data = []
            for time_slot in listing_data.meetup_time_slots:
                # Validate that start_time is before end_time
                if time_slot.start_time >= time_slot.end_time:
                    raise HTTPException(
                        status_code=400,
                        detail="Start time must be before end time for all meetup slots"
                    )
                
                meetup_time_data.append({
                    "start_time": time_slot.start_time.isoformat(),
                    "end_time": time_slot.end_time.isoformat()
                })
            
            # Insert all meetup time slots using database function
            if meetup_time_data:
                try:
                    await listings_db.add_listing_meetup_times(current_user["user_id"], listing_id, meetup_time_data)
                except Exception as e:
                    # Log warning but don't fail the entire listing creation
                    print(f"Warning: Failed to insert meetup time details for listing {listing_id}: {e}")
        
        return CreateListingResponse(
            success=True,
            message="Listing created successfully",
            data={
                "listing_id": created_listing["listing_id"],
                "name": created_listing["name"],
                "category": created_listing["category"],
                "status": created_listing["status"],
                "created_at": created_listing["created_at"],
                "meetup_slots_created": len(listing_data.meetup_time_slots) if listing_data.meetup_time_slots else 0
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating listing: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create listing: {str(e)}")

@router.patch("/listings/{listing_id}/status", response_model=UpdateListingStatusResponse)
async def update_listing_status(
    listing_id: int,
    status_data: UpdateListingStatusRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Update the status of a specific listing. Only the owner can update their listing status.
    Valid statuses: active, inactive, sold_out, archived
    """
    try:
        # Validate the new status
        validate_status(status_data.status)
        
        # Get current listing to check status and ownership
        current_listing = await listings_db.get_listing_by_id(
            user_id=current_user["user_id"],
            listing_id=listing_id,
            include_seller_info=False
        )
        
        if not current_listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        # Check ownership (this is also validated in the database function)
        if current_listing["seller_id"] != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="You can only update your own listings")
        
        # Check if status is actually changing
        if current_listing["status"] == status_data.status:
            return UpdateListingStatusResponse(
                success=True,
                message=f"Listing status is already '{status_data.status}'",
                data={
                    "listing_id": listing_id,
                    "name": current_listing["name"],
                    "old_status": current_listing["status"],
                    "new_status": status_data.status
                }
            )
        
        # Update the status using database function
        updated_listing = await listings_db.update_listing_status(
            user_id=current_user["user_id"],
            listing_id=listing_id,
            new_status=status_data.status
        )
        
        return UpdateListingStatusResponse(
            success=True,
            message=f"Listing status updated to '{status_data.status}' successfully",
            data={
                "listing_id": listing_id,
                "name": updated_listing["name"],
                "old_status": current_listing["status"],
                "new_status": updated_listing["status"],
                "updated_at": updated_listing["updated_at"]
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating listing status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update listing status: {str(e)}")
