from s3.utils import upload_file_with_metadata
from typing import Dict, Any, Optional

def none_to_empty_string(value: Optional[str]) -> str:
    """Convert None values to empty strings"""
    return value or ""

def clean_optional_fields(data: Dict[str, Any], fields: list) -> Dict[str, Any]:
    """Clean optional fields by converting None values to empty strings"""
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

# Backward compatibility wrapper
async def upload_file_to_s3_with_metadata(
    file, document_type: str, folder_prefix: str = "documents", 
    is_public: bool = False, default_ext: str = "jpg", context_info: str = ""
) -> str:
    """Upload a file to S3 and return the URL with enhanced metadata handling"""
    return await upload_file_with_metadata(
        file=file, document_type=document_type, folder_prefix=folder_prefix,
        is_public=is_public, default_ext=default_ext, context_info=context_info
    )

def create_standardized_response(
    message: str, 
    data: Dict[str, Any] = None, 
    status: str = "success"
) -> Dict[str, Any]:
    """Create a standardized API response format"""
    response = {
        "success": True if status == "success" else False,
        "status": status, 
        "message": message
    }
    if data:
        response["data"] = data
    return response

