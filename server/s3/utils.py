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
        # Add public/ or private/ prefix based on access level
        access_prefix = "public" if is_public else "private"
        s3_key = f"{access_prefix}/{folder_path}/{unique_filename}"
        
        bucket_name = os.getenv("S3_BUCKET")
        if not bucket_name:
            raise ValueError("S3 bucket name not configured")
        
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
        bucket_name = os.getenv("S3_BUCKET")
        if not bucket_name:
            raise ValueError("S3 bucket name not configured")
        
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket_name, 'Key': s3_key},
            ExpiresIn=expiration
        )
        return url
        
    except Exception as e:
        print(f"Error generating presigned URL: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate presigned URL: {str(e)}")

async def delete_file_from_s3(s3_key: str) -> bool:
    """
    Delete a file from S3
    
    Args:
        s3_key: The S3 key of the file to delete
        
    Returns:
        True if successful, False otherwise
    """
    try:
        bucket_name = os.getenv("S3_BUCKET")
        if not bucket_name:
            raise ValueError("S3 bucket name not configured")
        
        s3_client.delete_object(Bucket=bucket_name, Key=s3_key)
        print(f"Successfully deleted S3 file: {s3_key}")
        return True
        
    except Exception as e:
        print(f"Error deleting S3 file {s3_key}: {e}")
        return False

def extract_s3_key_from_url(url: str) -> str:
    """
    Extract S3 key from a full S3 URL
    
    Args:
        url: Full S3 URL (e.g., https://bucket.s3.region.amazonaws.com/path/file.jpg)
        
    Returns:
        S3 key (path/file.jpg)
    """
    try:
        if url.startswith('https://'):
            # Extract key from full URL
            parts = url.split('.amazonaws.com/')
            if len(parts) > 1:
                return parts[1]
        
        # If it's already just a key, return as is
        return url.lstrip('/')
        
    except Exception as e:
        print(f"Error extracting S3 key from URL {url}: {e}")
        return url

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
        file_ext = get_file_extension(str(file.filename), default_ext)
        
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
