import boto3
import os
from dotenv import load_dotenv
from typing import Optional
import uuid

# Load .env from the correct path
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(env_path)

# AWS Configuration
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
PRIVATE_BUCKET = os.getenv("S3_PRIVATE_BUCKET")  # For IDs and COR
PUBLIC_BUCKET = os.getenv("S3_PUBLIC_BUCKET")    # For profile pictures

s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=AWS_REGION
)

def generate_s3_url(bucket_name: str, file_key: str) -> str:
    """Generate the proper S3 URL based on region"""
    if AWS_REGION == "us-east-1":
        return f"https://{bucket_name}.s3.amazonaws.com/{file_key}"
    else:
        return f"https://{bucket_name}.s3.{AWS_REGION}.amazonaws.com/{file_key}"

async def upload_file_to_s3(
    file_content: bytes, 
    file_extension: str, 
    folder: str = "user_documents",
    is_public: bool = False
) -> Optional[str]:
    """
    Upload file to S3 and return the URL
    
    Args:
        file_content: The file content as bytes
        file_extension: File extension (jpg, png, pdf, etc.)
        folder: Folder structure within the bucket
        is_public: If True, uses public bucket; if False, uses private bucket
    """
    try:
        # Choose bucket based on file type
        bucket_name = PUBLIC_BUCKET if is_public else PRIVATE_BUCKET
        
        if not bucket_name:
            raise ValueError(f"{'Public' if is_public else 'Private'} bucket name not configured in environment variables")
        
        file_key = f"{folder}/{uuid.uuid4()}.{file_extension}"
        
        s3_client.put_object(
            Bucket=bucket_name,
            Key=file_key,
            Body=file_content,
            ContentType=f"image/{file_extension}" if file_extension in ['jpg', 'jpeg', 'png', 'svg'] else "application/pdf"
        )
        
        # Generate the proper S3 URL
        url = generate_s3_url(bucket_name, file_key)
        return url
        
    except Exception as e:
        print(f"Error uploading file to S3: {e}")
        return None
