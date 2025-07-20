from fastapi import UploadFile, HTTPException
from s3.utils import upload_file_to_s3
from typing import Dict, Any, Optional

def none_to_empty_string(value: Optional[str]) -> str:
    """Convert None values to empty strings"""
    return value or ""

def clean_optional_fields(data: Dict[str, Any], fields: list) -> Dict[str, Any]:
    """
    Clean optional fields in a dictionary by converting None values to empty strings
    
    Args:
        data: Dictionary containing the data
        fields: List of field names to clean
    
    Returns:
        Dictionary with cleaned fields
    """
    cleaned_data = data.copy()
    for field in fields:
        if field in cleaned_data:
            cleaned_data[field] = none_to_empty_string(cleaned_data[field])
    return cleaned_data

def get_file_extension(filename: str, default_ext: str = "jpg") -> str:
    """Extract file extension from filename, return default if not found"""
    if filename and '.' in filename:
        return filename.split('.')[-1]
    return default_ext

async def upload_file_to_s3_with_metadata(
    file: UploadFile, 
    document_type: str, 
    folder_prefix: str = "documents",
    is_public: bool = False,
    default_ext: str = "jpg",
    context_info: str = ""
) -> str:
    """
    Upload a file to S3 and return the URL with enhanced metadata handling
    
    Args:
        file: The uploaded file
        document_type: Type of document (e.g., 'student_id', 'cor', 'profile')
        folder_prefix: S3 folder prefix (default: 'documents')
        is_public: Whether to upload to public or private bucket
        default_ext: Default file extension if none found
        context_info: Additional context for logging (e.g., username)
    
    Returns:
        The S3 URL of the uploaded file
    
    Raises:
        HTTPException: If upload fails
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

def create_standardized_response(
    message: str, 
    data: Dict[str, Any] = None, 
    status: str = "success"
) -> Dict[str, Any]:
    """
    Create a standardized API response format
    
    Args:
        message: Response message
        data: Optional data to include in response
        status: Response status (default: 'success')
    
    Returns:
        Standardized response dictionary
    """
    response = {
        "status": status,
        "message": message
    }
    
    if data:
        response.update(data)
    
    return response

