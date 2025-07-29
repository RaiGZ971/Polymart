import boto3
from dotenv import load_dotenv
import os
from botocore.exceptions import ClientError
from fastapi import HTTPException

load_dotenv()

s3Client = boto3.client("s3")

def generate_private_urls(images: list[str]) -> list[str]:
    try:
        urls = []

        for image in images:
            url = s3Client.generate_presigned_url(
                "get_object",
                Params={"Bucket": os.getenv("S3_BUCKET"), "Key": f"private/{image}"},
                ExpiresIn=3600
            )
            urls.append(url)

        return urls
    
    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to generate private urls in {os.getenv("S3_BUCKET")}: {e.response["Error"]["Message"]}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate private urls: {str(e)}")
    
def generate_private_url(image: str) -> str:
    try:
        url = s3Client.generate_presigned_url(
            "get_object",
            Params={"Bucket": os.getenv("S3_BUCKET"), "Key": f"private/{image}"},
            ExpiresIn=3600
        )

        return url

    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to generate private url in {os.getenv('S3_BUCKET')}: {e.response['Error']['Message']}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate private url: {str(e)}")
    
def generate_public_urls(images: list[str]) -> list[str]:
    try:
        urls = [f"https://{os.getenv('S3_BUCKET')}.s3.{os.getenv('AWS_REGION')}.amazonaws.com/public/{image}" for image in images]

        return urls
    
    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to generate public url in {os.getenv('S3_BUCKET')}: {e.response['Error']['Message']}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate public url: {str(e)}")
    
def generate_public_url(image: str) -> str:
    try:
        url = f"https://{os.getenv('S3_BUCKET')}.s3.{os.getenv('AWS_REGION')}.amazonaws.com/public/{image}"
        
        return url
        
    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to generate public url in {os.getenv('S3_BUCKET')}: {e.response['Error']['Message']}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate public url: {str(e)}")

def convert_s3_key_to_signed_url(s3_key: str) -> str:
    """Convert an S3 key to a signed URL for private files"""
    return generate_private_url(s3_key)

def convert_s3_key_to_public_url(s3_key: str) -> str:
    """Convert an S3 key to a public URL for public files"""
    return generate_public_url(s3_key)

def ensure_proper_image_urls(images: list[str], is_private: bool = False) -> list[str]:
    """
    Ensure image URLs are proper URLs, not just S3 keys.
    If they're S3 keys, convert them to proper URLs.
    """
    proper_urls = []
    for image in images:
        # Check if it's already a full URL
        if image.startswith('https://') or image.startswith('http://'):
            proper_urls.append(image)
        else:
            # It's an S3 key, convert to proper URL
            if is_private:
                proper_urls.append(convert_s3_key_to_signed_url(image))
            else:
                proper_urls.append(convert_s3_key_to_public_url(image))
    return proper_urls
