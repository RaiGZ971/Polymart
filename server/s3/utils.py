from fastapi import UploadFile, File, HTTPException
import uuid
import boto3
import os
from dotenv import load_dotenv

load_dotenv()

# Create S3 client
s3_client = boto3.client("s3")

def create_image_url(types: str, id: str, file: UploadFile = File(...)) -> str:
    """Create a unique image URL path for S3 storage"""
    file_ext = file.filename.split('.')[-1] if file.filename and '.' in file.filename else 'jpg'
    return f"user_documents/{types}/{id}/{uuid.uuid4()}.{file_ext}"

def get_file_extension(filename: str, default_ext: str = "jpg") -> str:
    """Extract file extension from filename, return default if not found"""
    if filename and '.' in filename:
        return filename.split('.')[-1]
    return default_ext

async def upload_file_to_s3(
    file_content: bytes,
    file_ext: str,
    folder_path: str,
    is_public: bool = False
) -> str:
    """Upload file content to S3 and return the URL"""
    try:
        unique_filename = f"{uuid.uuid4()}.{file_ext}"
        s3_key = f"{folder_path}/{unique_filename}"
        
        bucket_name = os.getenv("S3_PUBLIC_BUCKET") if is_public else os.getenv("S3_PRIVATE_BUCKET")
        if not bucket_name:
            raise ValueError(f"{'Public' if is_public else 'Private'} S3 bucket name not configured")
        
        s3_client.put_object(Bucket=bucket_name, Key=s3_key, Body=file_content)
        
        if is_public:
            return f"https://{bucket_name}.s3.{os.getenv('AWS_REGION')}.amazonaws.com/{s3_key}"
        else:
            return s3_key  # Return S3 key for private files
        
    except Exception as e:
        print(f"Error uploading to S3: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload file to S3: {str(e)}")

def generate_presigned_url(s3_key: str, expiration: int = 3600) -> str:
    """Generate a presigned URL for accessing a private S3 object."""
    try:
        bucket_name = os.getenv("S3_PRIVATE_BUCKET")
        if not bucket_name:
            raise ValueError("Private S3 bucket name not configured")
        
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket_name, 'Key': s3_key},
            ExpiresIn=expiration
        )
        return url
        
    except Exception as e:
        print(f"Error generating presigned URL: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate presigned URL: {str(e)}")

async def upload_file_with_metadata(
    file: UploadFile,
    document_type: str,
    folder_prefix: str = "documents",
    is_public: bool = False,
    default_ext: str = "jpg",
    context_info: str = ""
) -> str:
    """
    Upload a file to S3 with metadata handling
    
    Args:
        file: The uploaded file
        document_type: Type of document (e.g., 'student_id', 'cor', 'profile')
        folder_prefix: S3 folder prefix (default: 'documents')
        is_public: Whether to upload to public or private bucket
        default_ext: Default file extension if none found
        context_info: Additional context for logging
    
    Returns:
        The S3 URL of the uploaded file
    """
    log_context = f" for {context_info}" if context_info else ""
    print(f"Uploading {document_type}{log_context}, filename: {file.filename}")
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Get file extension
        file_ext = get_file_extension(file.filename, default_ext)
        
        # Upload to S3
        file_url = await upload_file_to_s3(
            file_content,
            file_ext,
            f"{folder_prefix}/{document_type}",
            is_public=is_public
        )
        
        if not file_url:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to upload {document_type.replace('_', ' ')}"
            )
        
        print(f"{document_type} uploaded{log_context}: {file_url}")
        return file_url
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error uploading {document_type}: {str(e)}"
        )