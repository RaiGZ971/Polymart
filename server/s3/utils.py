from datetime import datetime, UTC
from dynamodb import models
from fastapi import UploadFile, File
import uuid

def get_image_url(types: str, id: str, file: UploadFile = File(...)):
    fileExtension = file.filename.split('.')[-1] if file.filename and '.' in file.filename else 'jpg'
    imageURL = f"user_documents/{types}/{id}/{uuid.uuid4()}.{fileExtension}"

    return imageURL
