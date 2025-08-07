from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class User(BaseModel):
    id: str
    username: str
    email: str
    hashed_password: str

class UserProfile(BaseModel):
    user_id: UUID
    username: str
    first_name: str
    middle_name: str
    last_name: str
    pronouns: Optional[str]
    course: Optional[str]
    university_branch: Optional[str]
    college: Optional[str]
    is_verified_student: bool
    profile_photo_url: Optional[str]
    bio: Optional[str]
    created_at: datetime

class UserProfileResponse(BaseModel):
    success: bool
    message: str
    data: Optional[UserProfile]

class ListingImage(BaseModel):
    image_id: int
    image_url: str
    is_primary: bool

class MeetupTimeSlot(BaseModel):
    start_time: datetime = Field(..., description="Start time for meetup availability")
    end_time: datetime = Field(..., description="End time for meetup availability")

class CreateListingRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Product name")
    description: Optional[str] = Field(None, description="Product description")
    category: str = Field(..., description="Product category")
    tags: Optional[str] = Field(None, description="Product tags")
    price_min: Optional[float] = Field(None, ge=0, description="Minimum price or fixed price")
    price_max: Optional[float] = Field(None, ge=0, description="Maximum price (optional for price ranges)")
    total_stock: Optional[int] = Field(None, ge=0, description="Total stock available")
    seller_meetup_locations: Optional[List[str]] = Field(None, description="Available meetup locations")
    meetup_time_slots: Optional[List[MeetupTimeSlot]] = Field(None, description="Available meetup time slots")
    transaction_methods: List[str] = Field(..., description="Available transaction methods (meet_up, online)")
    payment_methods: List[str] = Field(..., description="Available payment methods (cash, gcash, maya, bank_transfer, remittance)")

class CreateListingResponse(BaseModel):
    success: bool
    message: str
    data: dict

class UpdateListingStatusRequest(BaseModel):
    status: str = Field(..., description="New status for the listing (active, inactive, sold_out, archived)")

class UpdateListingStatusResponse(BaseModel):
    success: bool
    message: str
    data: dict

class MeetupSchedule(BaseModel):
    date: str
    times: List[str]

class ProductListing(BaseModel):
    listing_id: int
    seller_id: UUID
    seller_username: str
    seller_listing_count: int = 0
    seller_profile_photo_url: Optional[str] = None
    name: str
    description: Optional[str]
    category: str
    tags: Optional[str]
    price_min: Optional[float]
    price_max: Optional[float]
    total_stock: Optional[int]
    sold_count: int
    status: str
    created_at: datetime
    updated_at: datetime
    seller_meetup_locations: Optional[List[str]]
    transaction_methods: Optional[List[str]]
    payment_methods: Optional[List[str]]
    available_schedules: List[MeetupSchedule] = []
    images: List[ListingImage] = []

class ProductListingsResponse(BaseModel):
    products: List[ProductListing]
    total_count: int
    page: int
    page_size: int

class FavoriteRequest(BaseModel):
    listing_id: int = Field(..., description="ID of the listing to favorite/unfavorite")

class FavoriteResponse(BaseModel):
    success: bool
    message: str
    is_favorited: bool
    listing_id: int

class UserFavorite(BaseModel):
    listing_id: int
    favorited_at: datetime
    listing: Optional[ProductListing] = None

class UserFavoritesResponse(BaseModel):
    favorites: List[UserFavorite]
    total_count: int
    page: int
    page_size: int

class CreateOrderRequest(BaseModel):
    listing_id: int = Field(..., description="ID of the listing to order")
    quantity: int = Field(..., ge=1, description="Quantity to order")
    transaction_method: str = Field(..., description="Transaction method: meet_up or online")
    payment_method: str = Field(..., description="Payment method: cash, gcash, maya, bank_transfer, or remittance")
    buyer_requested_price: Optional[float] = Field(None, ge=0, description="Optional price requested by buyer (only for listings with price ranges where price_min != price_max)")

class Order(BaseModel):
    order_id: int
    buyer_id: UUID
    seller_id: UUID
    listing_id: int
    quantity: int
    buyer_requested_price: Optional[float]
    price_at_purchase: float
    status: str
    transaction_method: str
    payment_method: str
    placed_at: datetime
    listing: Optional[ProductListing] = None
    meetup: Optional['Meetup'] = None

class Meetup(BaseModel):
    meetup_id: int
    order_id: int
    location: Optional[str]
    scheduled_at: datetime
    status: str
    confirmed_by_buyer: bool
    confirmed_by_seller: bool
    confirmed_at: Optional[datetime]
    cancelled_at: Optional[datetime]
    cancellation_reason: Optional[str]
    remarks: Optional[str]
    created_at: datetime
    updated_at: datetime

class UpdateMeetupRequest(BaseModel):
    location: Optional[str] = Field(None, description="Meetup location")
    scheduled_at: Optional[datetime] = Field(None, description="Scheduled meetup date and time")

class CreateMeetupRequest(BaseModel):
    location: Optional[str] = Field(None, description="Initial meetup location")
    scheduled_at: datetime = Field(..., description="Scheduled meetup date and time")
    remarks: Optional[str] = Field(None, description="Additional remarks for the meetup")

class MeetupResponse(BaseModel):
    success: bool
    status: str
    message: str
    data: Meetup

class CreateOrderResponse(BaseModel):
    success: bool
    message: str
    data: Order

class OrdersResponse(BaseModel):
    orders: List[Order]
    total_count: int
    page: int
    page_size: int

# Update forward references
Order.model_rebuild()