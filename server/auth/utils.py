from datetime import datetime, timedelta
import jwt
import hashlib
import os
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from core.utils import create_standardized_response, none_to_empty_string
from typing import Dict, Any, Optional
from dotenv import load_dotenv

# Load environment variables
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(env_path)

# Security
security = HTTPBearer()

def get_hashed_password(pwd: str) -> str:
    """Hash password with salt"""
    pwd_salt_value = os.getenv("PWD_SALT")
    if pwd_salt_value is None:
        raise ValueError("PWD_SALT environment variable not found")
    
    pwd_salt = pwd + pwd_salt_value
    return hashlib.sha256(pwd_salt.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    pwd_salt_value = os.getenv("PWD_SALT")
    if pwd_salt_value is None:
        raise ValueError("PWD_SALT environment variable not found")
    
    pwd_salt = plain_password + pwd_salt_value
    return hashlib.sha256(pwd_salt.encode()).hexdigest() == hashed_password

def create_access_token(user_data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token with user data"""
    secret_key = os.getenv("SECRET_KEY")
    if not secret_key:
        raise ValueError("SECRET_KEY environment variable not found")
    
    to_encode = user_data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=24))
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    })
    
    return jwt.encode(to_encode, secret_key, algorithm="HS256")

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify and decode a JWT token"""
    try:
        secret_key = os.getenv("SECRET_KEY")
        if not secret_key:
            raise ValueError("SECRET_KEY environment variable not found")
        
        return jwt.decode(token, secret_key, algorithms=["HS256"])
    except (jwt.ExpiredSignatureError, jwt.JWTError):
        return None

def prepare_user_profile_data(
    username: str,
    first_name: str,
    middle_name: str,
    last_name: str,
    email: str,
    password_hash: str,
    birthdate: str,
    contact_number: str,
    course: str,
    university_branch: str,
    college: str,
    student_number: str,
    pronouns: Optional[str] = None,
    bio: Optional[str] = None,
    profile_photo_url: Optional[str] = None
) -> Dict[str, Any]:
    """Prepare user profile data for database insertion"""
    return {
        "username": username,
        "first_name": first_name,
        "middle_name": middle_name,
        "last_name": last_name,
        "email": email,
        "password_hash": password_hash,
        "birthdate": birthdate,
        "pronouns": none_to_empty_string(pronouns),
        "contact_number": contact_number,
        "course": course,
        "university_branch": university_branch,
        "college": college,
        "student_number": student_number,
        "bio": none_to_empty_string(bio),
        "profile_photo_url": profile_photo_url or ""
    }

def create_signup_response(user_id: str, username: str, email: str, first_name: str, last_name: str) -> Dict[str, Any]:
    """Create standardized signup success response"""
    user_data = {
        "user_id": user_id,
        "username": username,
        "email": email,
        "first_name": first_name,
        "last_name": last_name
    }
    
    return create_standardized_response(
        message="User created successfully",
        data=user_data
    )

def create_login_response(user_data: Dict[str, Any], access_token: str) -> Dict[str, Any]:
    """Create standardized login success response with token"""
    response_data = {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "user_id": user_data["user_id"],
            "username": user_data["username"],
            "email": user_data["email"],
            "first_name": user_data["first_name"],
            "last_name": user_data["last_name"],
            "student_number": user_data["student_number"],
            "is_verified": user_data.get("is_verified", False)
        }
    }
    
    return create_standardized_response(
        message="Login successful",
        data=response_data
    )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Dependency to get current authenticated user from JWT token"""
    try:
        payload = verify_token(credentials.credentials)
        if payload is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"}
            )
        return payload
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )