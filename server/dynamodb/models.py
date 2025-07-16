from pydantic import BaseModel

class message(BaseModel):
    message_id: str
    order_id: str
    sender_id: str
    receiver_id: str
    content: str
    created_at: str
    updated_at: str
    read_status: str

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
    product_id: str | None
    order_id: str | None
    rating: float
    description: str
    images: list[str]
    created_at: str
    updated_at: str
    reported: bool = False

class report(BaseModel):
    report_id: str
    reporter_id: str
    reported_entity_type: str
    reported_entity_id: str
    reason: str
    description: str
    status: str
    created_at:str



