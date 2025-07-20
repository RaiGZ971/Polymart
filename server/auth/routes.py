from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from auth import utils, schemas
from supabase_client.schemas import User
from supabase_client.database import create_user_profile, get_user_by_student_number
from core.utils import create_standardized_response
from typing import Optional
import json

router = APIRouter()

@router.post("/signup")
async def signup(
    username: str = Form(...),
    first_name: str = Form(...),
    middle_name: str = Form(...),
    last_name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    birthdate: str = Form(...),
    pronouns: Optional[str] = Form(None),
    contact_number: str = Form(...),
    course: str = Form(...),
    university_branch: str = Form(...),
    college: str = Form(...),
    student_number: str = Form(...),
    bio: Optional[str] = Form(None),
    student_id_front: UploadFile = File(...),
    student_id_back: UploadFile = File(...),
    cor_file: UploadFile = File(...),
    profile_photo: UploadFile = File(...)
):
    """
    Sign up route that creates a new user with verification documents
    """
    try:
        # Hash the password
        password_hash = utils.get_hashed_password(password)
        
        # Convert None values to empty strings for optional fields
        pronouns = pronouns or ""
        bio = bio or ""
        
        # Upload all user documents
        document_urls = await utils.upload_all_user_documents(
            username, student_id_front, student_id_back, cor_file, profile_photo
        )
        
        print("All files uploaded successfully, creating user profile...")
        
        # Prepare user profile data
        user_profile_data = utils.prepare_user_profile_data(
            username=username,
            first_name=first_name,
            middle_name=middle_name,
            last_name=last_name,
            email=email,
            password_hash=password_hash,
            birthdate=birthdate,
            contact_number=contact_number,
            course=course,
            university_branch=university_branch,
            college=college,
            student_number=student_number,
            document_urls=document_urls,
            pronouns=pronouns,
            bio=bio
        )
        
        # Create user profile
        user_result = await create_user_profile(user_profile_data)
        if not user_result:
            raise HTTPException(status_code=400, detail="Failed to create user profile")
        
        user_id = user_result["user_id"]
        
        # Create and return success response
        response_data = utils.create_signup_response(
            user_id, username, email, first_name, last_name
        )
        
        return JSONResponse(content=response_data, status_code=201)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/login")
async def login(
    student_number: str = Form(...),
    password: str = Form(...)
):
    """
    Login route using student number and password
    """
    try:
        # Find user by student number
        user = await get_user_by_student_number(student_number)
        if not user:
            raise HTTPException(
                status_code=401, 
                detail="Invalid student number or password"
            )
        
        # Verify password
        if not utils.verify_password(password, user["password_hash"]):
            raise HTTPException(
                status_code=401, 
                detail="Invalid student number or password"
            )
        
        # Create JWT token with user claims (compatible with RLS)
        token_data = {
            "user_id": user["user_id"],
            "username": user["username"],
            "email": user["email"],
            "student_number": user["student_number"]
        }
        
        access_token = utils.create_access_token(token_data)
        
        # Create and return login response
        response_data = utils.create_login_response(user, access_token)
        
        return JSONResponse(content=response_data, status_code=200)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/me")
async def get_current_user_info(current_user: dict = Depends(utils.get_current_user)):
    """
    Get current authenticated user information
    """
    try:
        user_id = current_user.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        
        # Get fresh user data from database
        user = await get_user_by_student_number(current_user.get("student_number"))
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Return user profile information (exclude sensitive data)
        user_info = {
            "user_id": user["user_id"],
            "username": user["username"],
            "first_name": user["first_name"],
            "middle_name": user["middle_name"],
            "last_name": user["last_name"],
            "email": user["email"],
            "student_number": user["student_number"],
            "course": user["course"],
            "university_branch": user["university_branch"],
            "college": user["college"],
            "is_verified": user["is_verified"],
            "profile_photo_url": user["profile_photo_url"],
            "bio": user["bio"],
            "pronouns": user["pronouns"]
        }
        
        response_data = create_standardized_response(
            message="User information retrieved successfully",
            data={"user": user_info}
        )
        
        return JSONResponse(content=response_data, status_code=200)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
