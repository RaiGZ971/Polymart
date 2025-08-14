"""
Base database utilities and common functions.
Contains shared database operations and helper functions.
"""

from typing import Optional, Dict, Any
from fastapi import HTTPException
from uuid import UUID
from supabase_client.auth_client import get_authenticated_supabase_client, get_unauthenticated_supabase_client


def get_authenticated_client(user_id: UUID):
    """Get authenticated Supabase client with error handling."""
    supabase = get_authenticated_supabase_client(user_id)
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection failed")
    return supabase


def get_unauthenticated_client():
    """Get unauthenticated Supabase client with error handling."""
    supabase = get_unauthenticated_supabase_client()
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


def handle_database_error(operation: str, error: Exception):
    """Handle database errors consistently."""
    print(f"Database error in {operation}: {error}")
    raise HTTPException(status_code=500, detail=f"Failed to {operation}: {str(error)}")


def validate_record_exists(data, error_message: str = "Record not found"):
    """Validate that a database record exists."""
    if not data:
        raise HTTPException(status_code=404, detail=error_message)
    return data


def validate_user_access(record_user_id: UUID, current_user_id: UUID, error_message: str = "Access denied"):
    """Validate that user has access to a record."""
    if record_user_id != current_user_id:
        raise HTTPException(status_code=403, detail=error_message)
