"""
User-related database operations.
Handles user profile management, verification, and authenticationasync def update_user_profile(user_id: UUID, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:operations.
"""

from typing import Optional, Dict, Any
from fastapi import HTTPException
from uuid import UUID
from .base import get_authenticated_client, get_unauthenticated_client, handle_database_error


async def create_user_profile(user_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Create a new user profile in the database
    """
    try:
        # Use unauthenticated client for signup
        supabase = get_unauthenticated_client()
        
        # Insert user profile
        result = supabase.table("user_profile").insert(user_data).execute()
        
        if result.data:
            return result.data[0]
        return None
    except Exception as e:
        handle_database_error("create user profile", e)


async def create_user_verification_documents(user_id: UUID, document_urls: Dict[str, str]) -> Optional[Dict[str, Any]]:
    """
    Create user verification documents entry in the user_verification table
    """
    try:
        # Use authenticated client with user context for RLS
        supabase = get_authenticated_client(user_id)
        
        verification_data = {
            "user_id": user_id,
            "student_id_front_url": document_urls.get("student_id_front_url"),
            "student_id_back_url": document_urls.get("student_id_back_url"),
            "cor_url": document_urls.get("cor_url"),
            "status": "pending"
        }
        
        print(f"Attempting to insert verification data for user_id: {user_id}")
        result = supabase.table("user_verification").insert(verification_data).execute()
        
        if result.data:
            print(f"Successfully created verification record: {result.data[0]}")
            return result.data[0]
        else:
            print(f"No data returned from insert operation. Result: {result}")
        return None
    except Exception as e:
        handle_database_error("create user verification documents", e)


async def update_user_verification_documents(user_id: UUID, document_urls: Dict[str, str]) -> Optional[Dict[str, Any]]:
    """
    Update existing user verification documents (for resubmission)
    """
    try:
        # Use authenticated client with user context for RLS
        supabase = get_authenticated_client(user_id)
        
        update_data = {
            "student_id_front_url": document_urls.get("student_id_front_url"),
            "student_id_back_url": document_urls.get("student_id_back_url"),
            "cor_url": document_urls.get("cor_url"),
            "status": "pending"  # Reset to pending when resubmitting
        }
        
        print(f"Attempting to update verification data for user_id: {user_id}")
        result = supabase.table("user_verification").update(update_data).eq("user_id", user_id).execute()
        
        if result.data:
            print(f"Successfully updated verification record: {result.data[0]}")
            return result.data[0]
        else:
            print(f"No data returned from update operation. Result: {result}")
        return None
    except Exception as e:
        handle_database_error("update user verification documents", e)


async def get_user_verification_status(user_id: UUID) -> Optional[Dict[str, Any]]:
    """
    Get user verification status by user_id
    """
    try:
        # Use authenticated client with user context for RLS
        supabase = get_authenticated_client(user_id)
        
        result = supabase.table("user_verification").select("*").eq("user_id", user_id).execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0]
        return None
    except Exception as e:
        handle_database_error("get user verification status", e)


async def update_user_profile(user_id: int, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Update user profile data
    """
    try:
        # Use authenticated client with user context for RLS
        supabase = get_authenticated_client(user_id)
        
        # Add updated_at timestamp
        update_data["updated_at"] = "now()"
        
        print(f"Attempting to update profile for user_id: {user_id} with data: {update_data}")
        result = supabase.table("user_profile").update(update_data).eq("user_id", user_id).execute()
        
        if result.data and len(result.data) > 0:
            print(f"Successfully updated user profile: {result.data[0]}")
            return result.data[0]
        else:
            print(f"No data returned from update operation. Result: {result}")
        return None
    except Exception as e:
        handle_database_error("update user profile", e)


async def get_user_by_student_number(student_number: str) -> Optional[Dict[str, Any]]:
    """
    Get a user profile by student number
    """
    try:
        # Use unauthenticated client for public lookup
        supabase = get_unauthenticated_client()
        
        result = supabase.table("user_profile").select("*").eq("student_number", student_number).execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0]
        return None
    except Exception as e:
        handle_database_error("get user by student number", e)


async def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """
    Get a user profile by email address
    """
    try:
        # Use unauthenticated client for public lookup
        supabase = get_unauthenticated_client()
        
        result = supabase.table("user_profile").select("*").eq("email", email.lower().strip()).execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0]
        return None
    except Exception as e:
        handle_database_error("get user by email", e)


async def get_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    """
    Get a user profile by username
    """
    try:
        # Use unauthenticated client for public lookup
        supabase = get_unauthenticated_client()
        
        result = supabase.table("user_profile").select("*").eq("username", username).execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0]
        return None
    except Exception as e:
        handle_database_error("get user by username", e)


async def get_user_by_id(user_id: UUID, include_private: bool = False) -> Optional[Dict[str, Any]]:
    """
    Get a user profile by user ID.
    
    Args:
        user_id: The user ID to fetch
        include_private: Whether to include private fields (email, contact_number, etc.)
    
    Returns:
        User profile data or None if not found
    """
    try:
        # Use unauthenticated client for public lookup
        supabase = get_unauthenticated_client()
        
        if include_private:
            # Include all fields for authenticated requests
            select_fields = "*"
        else:
            # Only public fields for general user lookup
            select_fields = """
                user_id,
                username,
                first_name,
                middle_name,
                last_name,
                pronouns,
                course,
                university_branch,
                college,
                is_verified_student,
                profile_photo_url,
                bio,
                created_at
            """
        
        result = supabase.table("user_profile").select(select_fields).eq("user_id", user_id).execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0]
        return None
    except Exception as e:
        handle_database_error("get user by ID", e)
