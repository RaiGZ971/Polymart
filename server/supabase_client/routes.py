from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from typing import Optional, List
from supabase_client.auth_client import get_authenticated_supabase_client
from supabase_client.schemas import ProductListingsResponse, ProductListing, ListingImage, CreateListingRequest, CreateListingResponse
from auth.utils import get_current_user
from core.utils import create_standardized_response
import json

# Product categories - must match database schema constraints
VALID_CATEGORIES = {
    "Academic_Essentials",
    "Tech_Gadgets", 
    "Creative_Works",
    "Fashion",
    "Services",
    "Other"
}

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
        # Validate category parameter
        if category and category not in VALID_CATEGORIES:
            raise HTTPException(status_code=400, detail=f"Invalid category. Valid categories are: {', '.join(VALID_CATEGORIES)}")
        
        # Use authenticated client with user context
        supabase = get_authenticated_supabase_client(current_user["user_id"])
        if not supabase:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        # Calculate offset for pagination
        offset = (page - 1) * page_size
        
        # Base query - exclude current user's listings and handle NULL seller_id (no join)
        query = supabase.table("listings").select(
            "listing_id,seller_id,name,description,category,tags,price_min,price_max,total_stock,sold_count,status,created_at,updated_at,seller_meetup_locations"
        ).neq("seller_id", current_user["user_id"]).not_.is_("seller_id", "null").eq("status", "active")
        
        # Apply filters
        if category:
            query = query.eq("category", category)
        
        if search:
            # Search in name and description
            query = query.or_(f"name.ilike.%{search}%,description.ilike.%{search}%")
        
        if min_price is not None:
            query = query.gte("price_min", min_price)
        
        if max_price is not None:
            query = query.lte("price_max", max_price)
        
        # Get total count for pagination
        count_result = query.execute()
        total_count = len(count_result.data) if count_result.data else 0
        
        # Apply pagination and order
        query = query.order("created_at", desc=True).range(offset, offset + page_size - 1)
        
        # Execute query
        result = query.execute()
        
        if not result.data:
            return ProductListingsResponse(
                products=[],
                total_count=0,
                page=page,
                page_size=page_size
            )
        
        # Process listings and get images
        products = []
        for listing in result.data:
            # Get images for this listing
            images_result = supabase.table("listing_images").select("""
                image_id,
                image_url,
                is_primary
            """).eq("listing_id", listing["listing_id"]).order("is_primary", desc=True).execute()
            images = []
            if images_result.data:
                from core.config import ensure_proper_image_urls
                # Extract image URLs and ensure they're proper URLs
                image_urls = [img["image_url"] for img in images_result.data]
                proper_urls = ensure_proper_image_urls(image_urls, is_private=False)
                images = [
                    ListingImage(
                        image_id=img["image_id"],
                        image_url=proper_url,
                        is_primary=img["is_primary"]
                    )
                    for img, proper_url in zip(images_result.data, proper_urls)
                ]
            # Create product listing object
            product = ProductListing(
                listing_id=listing["listing_id"],
                seller_id=listing["seller_id"],
                seller_username=str(listing["seller_id"]),
                name=listing["name"],
                description=listing["description"],
                category=listing["category"],
                tags=listing["tags"],
                price_min=listing["price_min"],
                price_max=listing["price_max"],
                total_stock=listing["total_stock"],
                sold_count=listing["sold_count"],
                status=listing["status"],
                created_at=listing["created_at"],
                updated_at=listing["updated_at"],
                seller_meetup_locations=listing["seller_meetup_locations"],
                images=images
            )
            products.append(product)
        
        return ProductListingsResponse(
            products=products,
            total_count=total_count,
            page=page,
            page_size=page_size
        )
        
    except Exception as e:
        print(f"Error fetching product listings: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch product listings: {str(e)}")

@router.get("/listings/my-listings", response_model=ProductListingsResponse)
async def get_my_listings(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Number of items per page"),
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search in product name and description"),
    status: Optional[str] = Query(None, description="Filter by status (active, inactive, sold_out, archived)"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get the current user's own product listings.
    Supports pagination, filtering, and search. Includes all statuses by default.
    """
    try:
        # Validate category parameter
        if category and category not in VALID_CATEGORIES:
            raise HTTPException(status_code=400, detail=f"Invalid category. Valid categories are: {', '.join(VALID_CATEGORIES)}")
        
        # Validate status parameter
        valid_statuses = {"active", "inactive", "sold_out", "archived"}
        if status and status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Valid statuses are: {', '.join(valid_statuses)}")
        
        # Use authenticated client with user context
        supabase = get_authenticated_supabase_client(current_user["user_id"])
        if not supabase:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        # Calculate offset for pagination
        offset = (page - 1) * page_size
        
        # Base query - only current user's listings (exclude NULL seller_id)
        query = supabase.table("listings").select(
            "listing_id,seller_id,name,description,category,tags,price_min,price_max,total_stock,sold_count,status,created_at,updated_at,seller_meetup_locations"
        ).eq("seller_id", current_user["user_id"])
        
        # Apply filters
        if category:
            query = query.eq("category", category)
        
        if status:
            query = query.eq("status", status)
        
        if search:
            # Search in name and description
            query = query.or_(f"name.ilike.%{search}%,description.ilike.%{search}%")
        
        # Get total count for pagination
        count_result = query.execute()
        total_count = len(count_result.data) if count_result.data else 0
        
        # Apply pagination and order
        query = query.order("created_at", desc=True).range(offset, offset + page_size - 1)
        
        # Execute query
        result = query.execute()
        
        if not result.data:
            return ProductListingsResponse(
                products=[],
                total_count=0,
                page=page,
                page_size=page_size
            )
        
        # Process listings and get images
        products = []
        for listing in result.data:
            # Get images for this listing
            images_result = supabase.table("listing_images").select("""
                image_id,
                image_url,
                is_primary
            """).eq("listing_id", listing["listing_id"]).order("is_primary", desc=True).execute()
            images = []
            if images_result.data:
                from core.config import ensure_proper_image_urls
                # Extract image URLs and ensure they're proper URLs
                image_urls = [img["image_url"] for img in images_result.data]
                proper_urls = ensure_proper_image_urls(image_urls, is_private=False)
                images = [
                    ListingImage(
                        image_id=img["image_id"],
                        image_url=proper_url,
                        is_primary=img["is_primary"]
                    )
                    for img, proper_url in zip(images_result.data, proper_urls)
                ]
            # Create product listing object
            product = ProductListing(
                listing_id=listing["listing_id"],
                seller_id=listing["seller_id"],
                seller_username=str(listing["seller_id"]),
                name=listing["name"],
                description=listing["description"],
                category=listing["category"],
                tags=listing["tags"],
                price_min=listing["price_min"],
                price_max=listing["price_max"],
                total_stock=listing["total_stock"],
                sold_count=listing["sold_count"],
                status=listing["status"],
                created_at=listing["created_at"],
                updated_at=listing["updated_at"],
                seller_meetup_locations=listing["seller_meetup_locations"],
                images=images
            )
            products.append(product)
        
        return ProductListingsResponse(
            products=products,
            total_count=total_count,
            page=page,
            page_size=page_size
        )
        
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
        # Use authenticated client with user context
        supabase = get_authenticated_supabase_client(current_user["user_id"])
        if not supabase:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        # Get the listing - allow access to any active listing including user's own
        result = supabase.table("listings").select("""
            listing_id,
            seller_id,
            name,
            description,
            category,
            tags,
            price_min,
            price_max,
            total_stock,
            sold_count,
            status,
            created_at,
            updated_at,
            seller_meetup_locations,
            user_profile!inner(username)
        """).eq("listing_id", listing_id).eq("status", "active").not_.is_("seller_id", "null").execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(status_code=404, detail="Product not found or not accessible")
        
        listing = result.data[0]
        
        # Get images for this listing
        images_result = supabase.table("listing_images").select("""
            image_id,
            image_url,
            is_primary
        """).eq("listing_id", listing["listing_id"]).order("is_primary", desc=True).execute()
        
        images = []
        if images_result.data:
            from core.config import ensure_proper_image_urls
            
            # Extract image URLs and ensure they're proper URLs
            image_urls = [img["image_url"] for img in images_result.data]
            proper_urls = ensure_proper_image_urls(image_urls, is_private=False)
            
            images = [
                ListingImage(
                    image_id=img["image_id"],
                    image_url=proper_url,
                    is_primary=img["is_primary"]
                )
                for img, proper_url in zip(images_result.data, proper_urls)
            ]
        
        # Create product listing object
        product = ProductListing(
            listing_id=listing["listing_id"],
            seller_id=listing["seller_id"],
            seller_username=listing["user_profile"]["username"],
            name=listing["name"],
            description=listing["description"],
            category=listing["category"],
            tags=listing["tags"],
            price_min=listing["price_min"],
            price_max=listing["price_max"],
            total_stock=listing["total_stock"],
            sold_count=listing["sold_count"],
            status=listing["status"],
            created_at=listing["created_at"],
            updated_at=listing["updated_at"],
            seller_meetup_locations=listing["seller_meetup_locations"],
            images=images
        )
        
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
        # Validate category
        if listing_data.category not in VALID_CATEGORIES:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid category. Valid categories are: {', '.join(VALID_CATEGORIES)}"
            )
        
        # Validate price range
        if listing_data.price_min is None and listing_data.price_max is not None:
            raise HTTPException(
                status_code=400,
                detail="Cannot set maximum price without minimum price. Use price_min for single price items."
            )
        
        if (listing_data.price_min is not None and 
            listing_data.price_max is not None and 
            listing_data.price_max < listing_data.price_min):
            raise HTTPException(
                status_code=400,
                detail="Maximum price must be greater than or equal to minimum price"
            )
        
        # Use authenticated client with user context
        supabase = get_authenticated_supabase_client(current_user["user_id"])
        if not supabase:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
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