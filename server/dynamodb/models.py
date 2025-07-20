from pydantic import BaseModel

from decimal import Decimal

class message(BaseModel):
    room_id: str                        #partition-key
    message_id: str          
    sender_id: str
    receiver_id: str
    content: str | None = None
    image: str | None = None
    created_at: str                     #sort-key
    updated_at: str
    read_status: bool = False

class notification(BaseModel):
    user_id: str                        #partition-key
    notification_id: str
    notification_type: str
    content: str
    related_id: str
    seen: bool = False
    timestamp: str                      #sort-key

class raw_notification(BaseModel):
    user_id: str
    notification_type: str
    content: str
    related_id: str

class review(BaseModel):
    reviewee_id: str                    #partition-key
    review_id: str
    reviewer_id: str
    reviewer_type: str
    product_id: str | None = None
    order_id: str | None = None
    rating: Decimal
    description: str
    images: list[str] | None = None
    created_at: str                     #sort-key
    updated_at: str
    reported: bool = False

class raw_review(BaseModel):
    reviewer_id: str
    reviewee_id: str
    reviewer_type: str
    product_id: str | None = None
    order_id: str | None = None
    rating: Decimal
    description: str
    images: list[str] | None = None
    reported: bool = False

class update_review(BaseModel):
    rating: Decimal | None = None
    description: str | None = None
    images: list[str] | None = None
    reported: bool | None = None


class report(BaseModel):
    report_id: str                      #partition-key
    reporter_id: str
    reported_entity_type: str
    reported_entity_id: str
    reason: str
    description: str
    status: str | None = "Not Checked"
    created_at:str                      #sort-key

class raw_report(BaseModel):
    reporter_id: str
    reporter_entity_type: str
    reported_entity_id: str
    reason: str
    description: str




