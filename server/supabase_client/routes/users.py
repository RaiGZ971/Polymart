"""
User-related routes for the Supabase client.
Handles user profile operations and user information retrieval.
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from supabase_client.schemas import UserProfile, UserProfileResponse
from supabase_client.database import users as users_db
from auth.utils import get_current_user_optional
from core.utils import create_standardized_response

router = APIRouter()

@router.get("/users/{user_id}", response_model=UserProfileResponse)
async def get_user_profile(
    user_id: int,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Get user profile by user ID.
    Returns public information for all users, or private information if requesting own profile.
    """
    try:
        # Determine if this is the user's own profile
        is_own_profile = current_user and current_user.get("user_id") == user_id
        
        # Get user data from database
        user_data = await users_db.get_user_by_id(user_id, include_private=is_own_profile)
        
        if not user_data:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        
        # Convert to UserProfile schema
        user_profile = UserProfile(
            user_id=user_data["user_id"],
            username=user_data["username"],
            first_name=user_data["first_name"],
            middle_name=user_data["middle_name"],
            last_name=user_data["last_name"],
            pronouns=user_data.get("pronouns"),
            course=user_data.get("course"),
            university_branch=user_data.get("university_branch"),
            college=user_data.get("college"),
            is_verified_student=user_data["is_verified_student"],
            profile_photo_url=user_data.get("profile_photo_url"),
            bio=user_data.get("bio"),
            created_at=user_data["created_at"]
        )
        
        return UserProfileResponse(
            success=True,
            message="User profile retrieved successfully",
            data=user_profile
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting user profile: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get user profile: {str(e)}"
        )


