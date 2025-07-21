from fastapi import APIRouter, HTTPException, UploadFile, File
import boto3
from s3 import utils
from botocore.exceptions import ClientError
from dotenv import load_dotenv
import os
from urllib.parse import urlparse

load_dotenv()

router = APIRouter()

#Create Client
s3Client = boto3.client("s3")

@router.post("/review/{reviewee_id}")
async def upload_review_images(reviewee_id: str, images: list[UploadFile] = File(...)):
    try:
        processedImages = [utils.create_image_url("reviews", reviewee_id, image) for image in images]

        for image, file in zip(processedImages, images):
            s3Client.upload_fileobj(
                file.file,
                os.getenv("S3_PUBLIC_BUCKET"),
                image,
                ExtraArgs={"ContentType": file.content_type}
            )

        return{"images": processedImages}

    except ClientError as e:
        raise HTTPException(status_code=e.response["responseMetadata"]["HTTPStatusCode"], detail=f"Failed to upload array images in {os.getenv("S3_PUBLIC_BUCKET")}/user_documents/reviews/{reviewee_id}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload array images: {str(e)}")
    
@router.post("/message/{room_id}")
async def upload_message_image(room_id: str, image: UploadFile = File(...)):
    try:
        processedImage = utils.create_image_url("messages", room_id, image)

        s3Client.upload_fileobj(
            image.file,
            os.getenv("S3_PRIVATE_BUCKET"),
            processedImage,
            ExtraArgs={"ContentType": image.content_type}
        )

        return{"image": processedImage}

    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to upload image in {os.getenv("S3_PRIVATE_BUCKET")}/user_documents/messages/{room_id}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")
    
@router.delete("/message")
async def delete_message_image(image: str):
    try:
        parsedImage = urlparse(image)
        key = parsedImage.path.lstrip("/")

        s3Client.delete_object(
            Bucket=os.getenv("S3_PRIVATE_BUCKET"),
            Key=key
        )

        return{"image deleted": key}
    
    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to delete image meesage in {os.getenv("S3_PRIVATE_BUCKET")}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete image message: {str(e)}")
    
@router.delete("/review-images")
async def delete_review_images(images: list[str]):
    try:
        parsedImages = [urlparse(image) for image in images]
        keys = [parsedImage.path.lstrip("/") for parsedImage in parsedImages]
    
        s3Client.delete_objects(
            Bucket=os.getenv("S3_PUBLIC_BUCKET"), 
            Delete={"Objects": [{"Key": key} for key in keys]}
        )

        return {"images deleted": keys}
    
    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to delete images review in {os.getenv("S3_PUBLIC_BUCKET")}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete images in review: {str(e)}")

@router.delete("/review-image")
async def delete_review_image(image: str):
    try:
        parsedImage = urlparse(image)
        key = parsedImage.path.lstrip("/")

        s3Client.delete_object(
            Bucket=os.getenv("S3_PUBLIC_BUCKET"),
            Key=key
        )

        return {"image deleted": key}
    
    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to delete image review in {os.getenv("S3_PUBLIC_BUCKET")}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete image review: {str(e)}")