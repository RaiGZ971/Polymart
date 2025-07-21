from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from typing import Optional, List
from supabase_client.auth_client import get_authenticated_supabase_client
from supabase_client.schemas import ProductListingsResponse, ProductListing, ListingImage
from auth.utils import get_current_user
from core.utils import create_standardized_response
import json

router = APIRouter()

@router.get("/products", response_model=ProductListingsResponse)
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
        # Use authenticated client with user context
        supabase = get_authenticated_supabase_client(current_user["user_id"])
        if not supabase:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        # Calculate offset for pagination
        offset = (page - 1) * page_size
        
        # Base query - exclude current user's listings
        query = supabase.table("listings").select("""
            listing_id,
            seller_id,
            name,
            description,
            category,
            price_min,
            price_max,
            total_stock,
            sold_count,
            status,
            created_at,
            updated_at,
            user_profile!inner(username)
        """).neq("seller_id", current_user["user_id"]).eq("status", "active")
        
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
                seller_username=listing["user_profile"]["username"],
                name=listing["name"],
                description=listing["description"],
                category=listing["category"],
                price_min=listing["price_min"],
                price_max=listing["price_max"],
                total_stock=listing["total_stock"],
                sold_count=listing["sold_count"],
                status=listing["status"],
                created_at=listing["created_at"],
                updated_at=listing["updated_at"],
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

@router.get("/products/categories")
async def get_product_categories():
    """
    Get all available product categories
    """
    try:
        categories = [
            "Academic_Essentials",
            "Tech_Gadgets", 
            "Creative_Works",
            "Fashion",
            "Services",
            "Other"
        ]
        
        return create_standardized_response(
            success=True,
            message="Categories retrieved successfully",
            data={"categories": categories}
        )
        
    except Exception as e:
        print(f"Error fetching categories: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch categories: {str(e)}")

@router.get("/products/{listing_id}", response_model=ProductListing)
async def get_product_by_id(
    listing_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Get a specific product listing by ID (excluding user's own products)
    """
    try:
        # Use authenticated client with user context
        supabase = get_authenticated_supabase_client(current_user["user_id"])
        if not supabase:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        # Get the listing
        result = supabase.table("listings").select("""
            listing_id,
            seller_id,
            name,
            description,
            category,
            price_min,
            price_max,
            total_stock,
            sold_count,
            status,
            created_at,
            updated_at,
            user_profile!inner(username)
        """).eq("listing_id", listing_id).eq("status", "active").neq("seller_id", current_user["user_id"]).execute()
        
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
            price_min=listing["price_min"],
            price_max=listing["price_max"],
            total_stock=listing["total_stock"],
            sold_count=listing["sold_count"],
            status=listing["status"],
            created_at=listing["created_at"],
            updated_at=listing["updated_at"],
            images=images
        )
        
        return product
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching product: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch product: {str(e)}")