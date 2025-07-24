"""
Listing-related routes for the Supabase client.
Handles product listing operations including CRUD and filtering.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from supabase_client.schemas import (
    ProductListingsResponse, ProductListing, CreateListingRequest, CreateListingResponse
)
from supabase_client.utils import (
    validate_category, validate_status, validate_price_range,
    get_supabase_client, convert_listings_to_products, convert_listing_to_product,
    apply_listing_filters, apply_pagination, get_total_count,
    build_public_listings_query, build_user_listings_query, build_listing_detail_query
)
from auth.utils import get_current_user

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
        
        # Get authenticated client
        supabase = get_supabase_client(current_user["user_id"])
        
        # Build base query
        query = build_public_listings_query(supabase, current_user["user_id"])
        
        # Apply filters
        query = apply_listing_filters(query, category, search, min_price, max_price)
        
        # Get total count for pagination
        total_count = get_total_count(query)
        
        # Apply pagination and execute
        query = apply_pagination(query, page, page_size)
        result = query.execute()
        
        if not result.data:
            return ProductListingsResponse(
                products=[],
                total_count=0,
                page=page,
                page_size=page_size
            )
        
        # Convert listings to products
        products = await convert_listings_to_products(supabase, result.data)
        
        return ProductListingsResponse(
            products=products,
            total_count=total_count,
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

        # Get authenticated client
        supabase = get_supabase_client(current_user["user_id"])

        # Build base query
        query = build_user_listings_query(supabase, current_user["user_id"])

        # Apply filters
        query = apply_listing_filters(query, category, search, status=status)

        # Get all listings (no pagination)
        result = query.order("created_at", desc=True).execute()

        if not result.data:
            return ProductListingsResponse(
                products=[],
                total_count=0,
                page=1,
                page_size=0
            )

        # Convert listings to products
        products = await convert_listings_to_products(supabase, result.data)

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
        # Get authenticated client
        supabase = get_supabase_client(current_user["user_id"])
        
        # Build query for listing details
        query = build_listing_detail_query(supabase, listing_id)
        result = query.execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(status_code=404, detail="Product not found or not accessible")
        
        listing = result.data[0]
        
        # Convert to product object
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
        
        # Get authenticated client
        supabase = get_supabase_client(current_user["user_id"])
        
        # Prepare listing data for insertion
        listing_insert_data = {
            "seller_id": current_user["user_id"],
            "name": listing_data.name,
            "description": listing_data.description,
            "category": listing_data.category,
            "tags": listing_data.tags,
            "price_min": listing_data.price_min,
            "price_max": listing_data.price_max,
            "total_stock": listing_data.total_stock,
            "seller_meetup_locations": listing_data.seller_meetup_locations,
            "status": "active",  # Default status
            "sold_count": 0  # Default sold count
        }
        
        # Insert the listing
        result = supabase.table("listings").insert(listing_insert_data).execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(status_code=500, detail="Failed to create listing")
        
        created_listing = result.data[0]
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
                    "listing_id": listing_id,
                    "start_time": time_slot.start_time.isoformat(),
                    "end_time": time_slot.end_time.isoformat()
                })
            
            # Insert all meetup time slots
            if meetup_time_data:
                meetup_result = supabase.table("listing_meetup_time_details").insert(meetup_time_data).execute()
                if not meetup_result.data:
                    # Log warning but don't fail the entire listing creation
                    print(f"Warning: Failed to insert meetup time details for listing {listing_id}")
        
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
