from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, Request
from fastapi.responses import JSONResponse, RedirectResponse, HTMLResponse
from fastapi.templating import Jinja2Templates
from auth import utils
from auth.models import SignUp, Login, SignUpResponse, LoginResponse, EmailVerificationResponse
from auth.email_verification import (
    create_email_verification_request, 
    send_verification_email, 
    verify_email_token_by_link,
    create_email_verification_response,
    check_email_verification_status
)
from supabase_client.database.users import create_user_profile, get_user_by_student_number, get_user_by_email, get_user_by_username, create_user_verification_documents
from core.utils import create_standardized_response
from typing import Optional
from pydantic import BaseModel, EmailStr
import os

router = APIRouter()

# Initialize Jinja2 templates
templates = Jinja2Templates(directory="templates")

# Pydantic models for request validation
class EmailVerificationRequest(BaseModel):
    email: EmailStr

class VerificationSessionRequest(BaseModel):
    session_token: str

# =============================================
# EMAIL VERIFICATION ENDPOINTS (STEP 1)
# =============================================

@router.post("/verify-email/send", response_model=EmailVerificationResponse)
async def send_email_verification(request: EmailVerificationRequest):
    """
    Step 1: Send verification token to email address.
    This is the first step in the 5-step signup flow.
    """
    try:
        email = request.email.lower().strip()
        
        # Check if user already exists and is verified
        existing_user = await get_user_by_email(email)
        if existing_user:
            # User already has a profile, check if they have an associated email verification
            # Since they have a profile, their email was already verified during signup
            response_data = create_email_verification_response(
                success=False,
                message="This email address is already verified and associated with an existing account. Please log in instead.",
                email=email,
                token_sent=False
            )
            return JSONResponse(content=response_data, status_code=400)
        
        # Create verification request in database
        verification_data = await create_email_verification_request(email)
        if not verification_data:
            raise HTTPException(
                status_code=500, 
                detail="Failed to create verification request"
            )
        
        # Send verification email
        email_sent = await send_verification_email(email, verification_data["token"])
        if not email_sent:
            raise HTTPException(
                status_code=500, 
                detail="Failed to send verification email"
            )
        
        # Return success response (don't expose the token)
        response_data = create_email_verification_response(
            success=True,
            message="Verification code sent successfully",
            email=email,
            token_sent=True
        )
        
        return JSONResponse(content=response_data, status_code=200)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/verify-session")
async def verify_verification_session(request: VerificationSessionRequest):
    """
    Verify a verification session token and return the associated email if valid.
    This is used to securely validate email verification status.
    """
    try:
        from auth.utils import verify_verification_session_token
        
        email = verify_verification_session_token(request.session_token)
        if not email:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired verification session"
            )
        
        # Return the verified email
        response_data = create_email_verification_response(
            success=True,
            message="Verification session valid",
            email=email,
            token_sent=True  # This indicates the email was previously verified
        )
        
        return JSONResponse(content=response_data, status_code=200)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/verify-email")
async def verify_email_link(token: str = Query(..., description="Verification token from email link")):
    """
    Email verification via link (GET request).
    This endpoint is called when users click the verification link in their email.
    Sets a secure session token and redirects to frontend.
    """
    try:
        # Verify token using the new link verification function
        verification_result = await verify_email_token_by_link(token)
        
        # Get frontend URL for redirects
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        
        if verification_result.get("status") == "success":
            email = verification_result.get("data", {}).get("email", "")
            
            # Check if user already exists with this email
            existing_user = await get_user_by_email(email)
            if existing_user:
                # User already has a profile, redirect to signin page
                redirect_url = f"{frontend_url}/signin?message=Email already verified. Please sign in."
                return RedirectResponse(url=redirect_url, status_code=302)
            else:
                # Create a secure verification session token
                from auth.utils import create_verification_session_token
                session_token = create_verification_session_token(email)
                
                # Redirect to signup page with secure session token
                redirect_url = f"{frontend_url}/signup?session={session_token}"
                return RedirectResponse(url=redirect_url, status_code=302)
        else:
            # Redirect to signup page with error message
            error_message = verification_result.get("message", "Verification failed")
            redirect_url = f"{frontend_url}/signup?verification_error={error_message}"
            return RedirectResponse(url=redirect_url, status_code=302)
            
    except Exception as e:
        # Redirect to signup page with generic error
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        redirect_url = f"{frontend_url}/signup?verification_error=Server error occurred"
        return RedirectResponse(url=redirect_url, status_code=302)

@router.get("/email-verified", response_class=HTMLResponse)
async def email_verified(request: Request):
    """
    Legacy endpoint for backward compatibility.
    Redirects to the frontend signup page.
    """
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    return RedirectResponse(url=f"{frontend_url}/signup", status_code=302)

# =============================================
# USER REGISTRATION ENDPOINTS (STEP 2-5)
# =============================================

@router.post("/signup", response_model=SignUpResponse, status_code=201)
async def signup(signup_data: SignUp):
    """
    Sign up route that creates a new user. Verification documents should be uploaded separately using /s3/user-documents/submit-verification.
    """
    try:
        print(f"Received signup request for email: {signup_data.email}")
        print(f"Full signup data: {signup_data}")
        
        # Check if email has been verified
        email_verified = await check_email_verification_status(signup_data.email)
        if not email_verified:
            raise HTTPException(
                status_code=400, 
                detail="Email must be verified before creating an account. Please verify your email first by using the /auth/verify-email/send endpoint."
            )
        
        # Check if user already exists with this email
        existing_user = await get_user_by_email(signup_data.email)
        if existing_user:
            raise HTTPException(
                status_code=409,
                detail="An account with this email address already exists. Please log in instead."
            )
        
        # Hash the password
        password_hash = utils.get_hashed_password(signup_data.password)
        
        # Convert None values to empty strings for optional fields
        pronouns = signup_data.pronouns or ""
        bio = signup_data.bio or ""
        middle_name = signup_data.middle_name or ""
        
        # Prepare user profile data (without verification documents or profile photo)
        user_profile_data = utils.prepare_user_profile_data(
            username=signup_data.username,
            first_name=signup_data.first_name,
            middle_name=middle_name,
            last_name=signup_data.last_name,
            email=signup_data.email,
            password_hash=password_hash,
            birthdate=signup_data.birthdate.isoformat(),  # Convert date to string
            contact_number=signup_data.contact_number,
            course=signup_data.course,
            university_branch=signup_data.university_branch,
            college=signup_data.college,
            student_number=signup_data.student_number,
            pronouns=pronouns,
            bio=bio,
            profile_photo_url=None
        )
        
        print("Creating user profile...")
        
        # Create user profile
        user_result = await create_user_profile(user_profile_data)
        if not user_result:
            # Check for specific conflicts by trying to find existing data
            existing_username = await get_user_by_username(signup_data.username)
            existing_student_number = await get_user_by_student_number(signup_data.student_number)
            
            if existing_username:
                raise HTTPException(
                    status_code=409, 
                    detail="Username already exists. Please choose a different username."
                )
            elif existing_student_number:
                raise HTTPException(
                    status_code=409, 
                    detail="Student number already registered. Please check your student number or contact support."
                )
            else:
                raise HTTPException(
                    status_code=400, 
                    detail="Failed to create user profile. Please check your data and try again."
                )

        user_id = user_result["user_id"]
        
        # Create and return success response
        response_data = utils.create_signup_response(
            user_id, signup_data.username, signup_data.email, signup_data.first_name, signup_data.last_name
        )
        
        # Add verification status to response
        if "data" not in response_data:
            response_data["data"] = {}
        response_data["data"]["verification_submitted"] = False
        response_data["data"]["requires_verification"] = True
        
        return JSONResponse(content=response_data, status_code=201)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/login", response_model=LoginResponse)
async def login(login_data: Login):
    """
    Login route using student number and password
    """
    try:
        # Find user by student number
        user = await get_user_by_student_number(login_data.student_number)
        if not user:
            raise HTTPException(
                status_code=401, 
                detail="Invalid student number or password"
            )
        
        # Verify password
        if not utils.verify_password(login_data.password, user["password_hash"]):
            raise HTTPException(
                status_code=401, 
                detail="Invalid student number or password"
            )
        
        # Create JWT token with user claims (compatible with RLS)
        token_data = {
            "user_id": user["user_id"],
            "username": user["username"],
            "email": user["email"],
            "student_number": user["student_number"],
            "is_verified_student": user.get("is_verified_student", False)
        }
        
        access_token = utils.create_access_token(token_data)
        
        # Create and return login response
        response_data = utils.create_login_response(user, access_token)
        
        return JSONResponse(content=response_data, status_code=200)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")