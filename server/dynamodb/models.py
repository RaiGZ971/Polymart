from datetime import datetime
from pydantic import BaseModel

class message(BaseModel):
    room_id: str
    message_id: str
    sender_id: str
    receiver_id: str
    content: str
    created_at: str
    updated_at: str
    read_status: bool = False

class notification(BaseModel):
    notifiaction_id: str
    user_id: str
    notification_type: str
    content: str
    related_id: str
    seen: bool = False
    timestamp: str

class review(BaseModel):
    review_id: str
    reviewer_id: str
    reviewee_id: str
    reviewer_type: str
    product_id: str | None = None
    order_id: str | None = None
    rating: float
    description: str
    images: list[str] | None = None
    created_at: datetime
    updated_at: datetime
    reported: bool = False

class raw_review(BaseModel):
    review_id: str
    reviewer_id: str
    reviewee_id: str
    reviewer_type: str
    product_id: str | None = None
    order_id: str | None = None
    rating: float
    description: str
    images: list[str] | None = None
    reported: bool = False

class update_review(BaseModel):
    rating: float | None = None
    description: str | None = None
    images: list[str] | None = None
    reported: bool | None = None


class report(BaseModel):
    report_id: str
    reporter_id: str
    reported_entity_type: str
    reported_entity_id: str
    reason: str
    description: str
    status: str
    created_at:str



