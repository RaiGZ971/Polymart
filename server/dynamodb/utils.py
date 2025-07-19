from datetime import datetime, UTC
from dynamodb import models
import uuid

def get_room(sender_id, receiver_id) -> str:
    return "".join(sorted([sender_id, receiver_id]))

def get_current_date() -> str:
    return str(datetime.now(UTC))

def process_review_form(form) -> models.review:
    currentDate = get_current_date()

    updatedForm = {
        **form.model_dump(),
        "created_at": currentDate,
        "updated_at": currentDate
    }

    return models.review(**updatedForm)

def process_message_form( room_id: str, message: str, sender_id: str, receiver_id: str) -> models.message:
    messageID = str(uuid.uuid4())
    currentDate = get_current_date()

    formattedResponse = {
        "room_id": room_id,
        "message_id": messageID,
        "sender_id": sender_id,
        "receiver_id": receiver_id,
        "content": message,
        "created_at": currentDate,
        "updated_at": currentDate,
        "read_status": False
    }

    return models.message(**formattedResponse)