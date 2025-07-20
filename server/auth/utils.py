from datetime import datetime, timezone, timedelta
import jwt
import hashlib
from dotenv import load_dotenv
import os
from fastapi import UploadFile, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from core.utils import get_file_extension, upload_file_to_s3_with_metadata, create_standardized_response, none_to_empty_string
from typing import Dict, Any, Optional

# Load .env from the correct path
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(env_path)

# Security
security = HTTPBearer()

def get_hashed_password(pwd):
    pwd_salt_value = os.getenv("PWD_SALT")
    print(f"PWD_SALT value: {pwd_salt_value}")
    
    if pwd_salt_value is None:
        raise ValueError("PWD_SALT environment variable not found")
    
    pwd_salt = pwd + pwd_salt_value
    hashed = hashlib.sha256(pwd_salt.encode())
    
    return hashed.hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash
    """
    pwd_salt_value = os.getenv("PWD_SALT")
    if pwd_salt_value is None:
        raise ValueError("PWD_SALT environment variable not found")
    
    pwd_salt = plain_password + pwd_salt_value
    hashed = hashlib.sha256(pwd_salt.encode())
    
    return hashed.hexdigest() == hashed_password

def create_access_token(user_data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token with user data
    
    Args:
        user_data: Dictionary containing user information (user_id, username, email, etc.)
        expires_delta: Optional expiration time delta
    
    Returns:
        JWT token string
    """
    secret_key = os.getenv("SECRET_KEY")
    if not secret_key:
        raise ValueError("SECRET_KEY environment variable not found")
    
    to_encode = user_data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=24)  # Default 24 hours
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    })
    
    encoded_jwt = jwt.encode(to_encode, secret_key, algorithm="HS256")
    return encoded_jwt

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify and decode a JWT token
    
    Args:
        token: JWT token string
    
    Returns:
        Dictionary containing token payload or None if invalid
    """
    try:
        secret_key = os.getenv("SECRET_KEY")
        if not secret_key:
            raise ValueError("SECRET_KEY environment variable not found")
        
        payload = jwt.decode(token, secret_key, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.JWTError:
        return None

async def upload_user_document(
    file: UploadFile, 
    document_type: str, 
    username: str,
    is_public: bool = False,
    default_ext: str = "jpg"
) -> str:
    """
    Upload a user document to S3 and return the URL
    
    Args:
        file: The uploaded file
        document_type: Type of document (e.g., 'student_id', 'cor', 'profile')
        username: Username for logging purposes
        is_public: Whether to upload to public or private bucket
        default_ext: Default file extension if none found
    
    Returns:
        The S3 URL of the uploaded file
    
    Raises:
        HTTPException: If upload fails
    """
    return await upload_file_to_s3_with_metadata(
        file=file,
        document_type=document_type,
        folder_prefix="user_documents/temp",
        is_public=is_public,
        default_ext=default_ext,
        context_info=f"user: {username}"
    )

async def upload_all_user_documents(
    username: str,
    student_id_front: UploadFile,
    student_id_back: UploadFile,
    cor_file: UploadFile,
    profile_photo: UploadFile
) -> Dict[str, str]:
    """
    Upload all user verification documents and return their URLs
    
    Returns:
        Dictionary containing all document URLs
    """
    print(f"Starting file uploads for user: {username}")
    
    # Upload student ID front (PRIVATE bucket)
    student_id_front_url = await upload_user_document(
        student_id_front, "student_id", username, is_public=False
    )
    
    # Upload student ID back (PRIVATE bucket)
    student_id_back_url = await upload_user_document(
        student_id_back, "student_id", username, is_public=False
    )
    
    # Upload COR (PRIVATE bucket)
    cor_url = await upload_user_document(
        cor_file, "cor", username, is_public=False, default_ext="pdf"
    )
    
    # Upload profile photo (PUBLIC bucket)
    profile_photo_url = await upload_user_document(
        profile_photo, "profile", username, is_public=True
    )
    
    print("All files uploaded successfully")
    
    return {
        "student_id_front_url": student_id_front_url,
        "student_id_back_url": student_id_back_url,
        "cor_url": cor_url,
        "profile_photo_url": profile_photo_url
    }

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
    document_urls: Dict[str, str],
    pronouns: Optional[str] = None,
    bio: Optional[str] = None
) -> Dict[str, Any]:
    """
    Prepare user profile data dictionary for database insertion
    Ensures optional fields are empty strings instead of None
    """
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
        **document_urls  # Unpack document URLs
    }

def create_signup_response(user_id: str, username: str, email: str, first_name: str, last_name: str) -> Dict[str, Any]:
    """
    Create standardized signup success response
    """
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
    """
    Create standardized login success response with token
    """
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
    """
    Dependency to get current authenticated user from JWT token
    """
    try:
        token = credentials.credentials
        payload = verify_token(token)
        
        if payload is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        return payload
        
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )