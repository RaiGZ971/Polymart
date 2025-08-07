"""
Helper functions for Supabase client operations.
Contains common database utilities, pagination, and client management.
"""

from fastapi import HTTPException
from uuid import UUID
from supabase_client.auth_client import get_authenticated_supabase_client


def get_supabase_client(user_id: UUID):
    """Get authenticated Supabase client with error handling."""
    supabase = get_authenticated_supabase_client(user_id)
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection failed")
    return supabase


def calculate_pagination_offset(page: int, page_size: int) -> int:
    """Calculate pagination offset."""
    return (page - 1) * page_size


def apply_pagination(query, page: int, page_size: int):
    """Apply pagination to a query."""
    offset = calculate_pagination_offset(page, page_size)
    return query.order("created_at", desc=True).range(offset, offset + page_size - 1)


def get_total_count(query) -> int:
    """Get total count of records for pagination."""
    count_result = query.execute()
    return len(count_result.data) if count_result.data else 0


def handle_database_errors(func):
    """Decorator to handle common database errors."""
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except HTTPException:
            raise
        except Exception as e:
            operation_name = func.__name__.replace('_', ' ')
            print(f"Error in {operation_name}: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to {operation_name}: {str(e)}")
    return wrapper
