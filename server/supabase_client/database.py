from supabase import create_client, Client
import os
from typing import Optional, Dict, Any
from .auth_client import get_authenticated_supabase_client, get_unauthenticated_supabase_client


async def create_user_profile(user_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Create a new user profile in the database
    """
    try:
        # Use unauthenticated client for signup
        supabase = get_unauthenticated_supabase_client()
        if not supabase:
            print("Failed to get Supabase client")
            return None
        
        # Insert user profile
        result = supabase.table("user_profile").insert(user_data).execute()
        
        if result.data:
            return result.data[0]
        return None
    except Exception as e:
        print(f"Error creating user profile: {e}")
        return None

async def create_user_verification_documents(user_id: int, document_urls: Dict[str, str]) -> Optional[Dict[str, Any]]:
    """
    Create user verification documents entry in the user_verification table
    """
    try:
        # Use authenticated client with user context for RLS
        supabase = get_authenticated_supabase_client(user_id)
        if not supabase:
            print("Failed to get Supabase authenticated client")
            return None
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
        print(f"Error creating user verification documents: {e}")
        return None


async def update_user_verification_documents(user_id: int, document_urls: Dict[str, str]) -> Optional[Dict[str, Any]]:
    """
    Update existing user verification documents (for resubmission)
    """
    try:
        # Use authenticated client with user context for RLS
        supabase = get_authenticated_supabase_client(user_id)
        if not supabase:
            print("Failed to get Supabase authenticated client")
            return None
        
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
        print(f"Error updating user verification documents: {e}")
        return None

async def get_user_verification_status(user_id: int) -> Optional[Dict[str, Any]]:
    """
    Get user verification status by user_id
    """
    try:
        # Use authenticated client with user context for RLS
        supabase = get_authenticated_supabase_client(user_id)
        if not supabase:
            print("Failed to get Supabase authenticated client")
            return None
        
        result = supabase.table("user_verification").select("*").eq("user_id", user_id).execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0]
        return None
    except Exception as e:
        print(f"Error getting user verification status: {e}")
        return None

async def update_user_profile(user_id: int, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Update user profile data
    """
    try:
        # Use authenticated client with user context for RLS
        supabase = get_authenticated_supabase_client(user_id)
        if not supabase:
            print("Failed to get Supabase authenticated client")
            return None
        
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
        print(f"Error updating user profile: {e}")
        return None

async def get_user_by_student_number(student_number: str) -> Optional[Dict[str, Any]]:
    """
    Get a user profile by student number
    """
    try:
        # Use unauthenticated client for public lookup
        supabase = get_unauthenticated_supabase_client()
        if not supabase:
            print("Failed to get Supabase client")
            return None
        
        result = supabase.table("user_profile").select("*").eq("student_number", student_number).execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0]
        return None
    except Exception as e:
        print(f"Error getting user by student number: {e}")
        return None

async def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """
    Get a user profile by email address
    """
    try:
        # Use unauthenticated client for public lookup
        supabase = get_unauthenticated_supabase_client()
        if not supabase:
            print("Failed to get Supabase client")
            return None
        
        result = supabase.table("user_profile").select("*").eq("email", email.lower().strip()).execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0]
        return None
    except Exception as e:
        print(f"Error getting user by email: {e}")
        return None
