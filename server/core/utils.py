"""
Core utilities for the application.
"""

import time
import functools
import logging
from typing import Callable, Any, Dict, Optional
from fastapi import Request

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Reduce httpx logging verbosity - only show errors
# This prevents every Supabase HTTP request from being logged
httpx_logger = logging.getLogger("httpx")
httpx_logger.setLevel(logging.WARNING)

def create_standardized_response(message: str, data: Any = None, success: bool = True, status: str = "success"):
    """
    Create a standardized API response format.
    Maintains backward compatibility with old calling patterns.
    
    Args:
        message: Response message
        data: Response data (optional)
        success: Whether the operation was successful (default: True)
        status: Status string for backward compatibility (default: "success")
    
    Returns:
        Dict with standardized response format
    """
    # Handle backward compatibility - if success is not explicitly set to False, 
    # determine it from the status parameter
    if status != "success" and success:
        success = False
    
    response = {
        "success": success,
        "status": status,
        "message": message
    }
    
    if data is not None:
        response["data"] = data
    
    return response

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

def performance_monitor(func: Callable) -> Callable:
    """Decorator to monitor function performance."""
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = await func(*args, **kwargs)
            execution_time = time.time() - start_time
            
            # Log slow operations (over 1 second)
            if execution_time > 1.0:
                logger.warning(f"Slow operation detected: {func.__name__} took {execution_time:.2f}s")
            elif execution_time > 0.5:
                logger.info(f"Operation: {func.__name__} took {execution_time:.2f}s")
                
            return result
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"Error in {func.__name__} after {execution_time:.2f}s: {str(e)}")
            raise
    
    return wrapper

def log_request_performance(request: Request, response_time: float):
    """Log request performance metrics - only important ones."""
    if response_time > 2.0:
        logger.warning(f"🚨 SLOW API: {request.method} {request.url.path} took {response_time:.2f}s")
    elif response_time > 1.0:
        logger.info(f"⚠️  Moderate: {request.method} {request.url.path} took {response_time:.2f}s")
    # Don't log fast requests to reduce noise

def get_performance_stats():
    """Get current performance statistics."""
    # This could be expanded to include more metrics
    return {
        "timestamp": time.time(),
        "log_level": logger.level
    }

