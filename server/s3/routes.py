from fastapi import APIRouter, HTTPException, UploadFile, File
import boto3
from s3 import utils
from botocore.exceptions import ClientError
from dotenv import load_dotenv
import os

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

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
                os.getenv("S3_POLYMART_PRIVATE"),
                image,
                ExtraArgs={"ContentType": file.content_type}
            )

        return{"images": processedImages}

    except ClientError as e:
        raise HTTPException(status_code=e.response["responseMetadata"]["HTTPStatusCode"], detail=f"Failed to upload array images in {os.getenv("S3-POLYMART-PRIVATE")}/user_documents/reviews/{reviewee_id}")
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
            os.getenv("S3_POLYMART_PRIVATE"),
            processedImage,
            ExtraArgs={"ContentType": image.content_type}
        )

        return{"image": processedImage}

    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to upload image in {os.getenv("S3-POLYMART-PRIVATE")}/user_documents/messages/{room_id}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")

        


