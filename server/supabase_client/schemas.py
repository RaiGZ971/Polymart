from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class User(BaseModel):
    id: str
    username: str
    email: str
    hashed_password: str

class ListingImage(BaseModel):
    image_id: int
    image_url: str
    is_primary: bool

class ProductListing(BaseModel):
    listing_id: int
    seller_id: int
    seller_username: str
    name: str
    description: Optional[str]
    category: str
    price_min: Optional[float]
    price_max: Optional[float]
    total_stock: Optional[int]
    sold_count: int
    status: str
    created_at: datetime
    updated_at: datetime
    images: List[ListingImage] = []

class ProductListingsResponse(BaseModel):
    products: List[ProductListing]
    total_count: int
    page: int
    page_size: int