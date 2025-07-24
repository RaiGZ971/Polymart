import os
import secrets
import smtplib
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from typing import Optional, Dict, Any
from supabase_client.auth_client import get_unauthenticated_supabase_client
from core.utils import create_standardized_response
from dotenv import load_dotenv

load_dotenv()

def generate_verification_token() -> str:
    """Generate a secure URL-safe verification token for email links"""
    return secrets.token_urlsafe(32)

def generate_verification_token_secure() -> str:
    """Generate a secure random verification token (alternative approach)"""
    return secrets.token_urlsafe(32)

async def create_email_verification_request(email: str) -> Optional[Dict[str, Any]]:
    """
    Create a new email verification request and store it in the database.
    Returns the verification data if successful, None otherwise.
    """
    try:
        # Generate verification token
        token = generate_verification_token()
        
        # Set expiration (configurable via environment variable)
        expire_minutes = int(os.getenv("EMAIL_VERIFICATION_EXPIRE_MINUTES", "15"))
        expires_at = datetime.utcnow() + timedelta(minutes=expire_minutes)
        
        # Get unauthenticated client (anyone can create verification requests)
        supabase = get_unauthenticated_supabase_client()
        if not supabase:
            print("Failed to get Supabase client")
            return None
        
        print(f"Creating verification request for email: {email}")
        print(f"Token: {token}")
        print(f"Expires at: {expires_at.isoformat()}")
        
        # Use UPSERT pattern to handle existing emails
        verification_data = {
            "email": email,
            "token": token,
            "expires_at": expires_at.isoformat(),
            "is_used": False
        }
        
        try:
            # Use upsert to insert new or update existing email verification request
            result = supabase.table("email_verification_requests")\
                .upsert(verification_data, on_conflict="email")\
                .execute()
            print(f"Upsert result: {result}")
        except Exception as e:
            print(f"Error inserting new token: {e}")
            return None
        
        if result and result.data:
            return {
                "email": email,
                "token": token,
                "expires_at": expires_at.isoformat()
            }
        
        print("No result data returned")
        return None
        
    except Exception as e:
        print(f"Error creating email verification request: {e}")
        import traceback
        traceback.print_exc()
        return None
        
    except Exception as e:
        print(f"Error creating email verification request: {e}")
        import traceback
        traceback.print_exc()
        return None

async def send_verification_email(email: str, token: str) -> bool:
    """
    Send verification email with a clickable verification link.
    Returns True if successful, False otherwise.
    """
    try:
        # Email configuration from environment variables
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        sender_email = os.getenv("SENDER_EMAIL")
        sender_password = os.getenv("SENDER_PASSWORD")
        
        # Get the base URL for the verification link
        base_url = os.getenv("BACKEND_URL", "http://localhost:8000")
        verification_url = f"{base_url}/auth/verify-email?token={token}"
        
        if not sender_email or not sender_password:
            print("Email configuration missing")
            return False
        
        # Send verification email
        # Create message
        message = MIMEMultipart("related")
        message["Subject"] = "Welcome to Polymart - Verify Your Email to Get Started"
        message["From"] = sender_email
        message["To"] = email

        # Create alternative container for HTML content
        msg_alternative = MIMEMultipart("alternative")
        
        # Read HTML template
        template_path = os.path.join(os.path.dirname(__file__), "..", "templates", "email-verification.html")
        try:
            with open(template_path, 'r', encoding='utf-8') as f:
                html_template = f.read()
        except FileNotFoundError:
            print(f"Template file not found at: {template_path}")
            return False
        
        # Replace template variables
        html_content = html_template.replace("{{ verification_url }}", verification_url)
        
        # Create HTML part
        html_part = MIMEText(html_content, "html")
        
        # Add HTML part to alternative container
        msg_alternative.attach(html_part)
        
        # Attach the alternative container to main message
        message.attach(msg_alternative)
        
        # Embed logo image
        logo_path = os.path.join(os.path.dirname(__file__), "..", "templates", "market.png")
        try:
            with open(logo_path, 'rb') as f:
                img_data = f.read()
            image = MIMEImage(img_data)
            image.add_header('Content-ID', '<polymart_logo>')
            image.add_header('Content-Disposition', 'inline', filename="polymart_logo.png")
            message.attach(image)
        except FileNotFoundError:
            print(f"Logo file not found at: {logo_path}")
            # Continue without logo - the email will still work
        
        # Send email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.send_message(message)
        
        print(f"Verification email sent successfully to {email}")
        return True
        
    except Exception as e:
        print(f"Error sending verification email: {e}")
        return False

async def verify_email_token_backend(email: str, token: str) -> Dict[str, Any]:
    """
    Verify email token using the PostgreSQL function.
    Returns a standardized response.
    """
    try:
        # Get unauthenticated client for RPC call
        supabase = get_unauthenticated_supabase_client()
        if not supabase:
            return create_standardized_response(
                message="Database connection failed",
                data={"email": email, "verified": False},
                status="error"
            )
        
        # Call the PostgreSQL function with only the token parameter
        # The function will handle finding the token, checking expiration, and marking as used
        result = supabase.rpc('verify_email_token', {
            'p_token': token
        }).execute()
        
        print(f"PostgreSQL function result: {result}")
        
        # The function returns a boolean: True if valid, False if invalid/expired
        if result.data is True:
            return create_standardized_response(
                message="Email verified successfully",
                data={"email": email, "verified": True},
                status="success"
            )
        else:
            return create_standardized_response(
                message="Invalid or expired verification token",
                data={"email": email, "verified": False},
                status="error"
            )
            
    except Exception as e:
        print(f"Error verifying email token: {e}")
        return create_standardized_response(
            message="Verification failed",
            data={"email": email, "verified": False},
            status="error"
        )

async def verify_email_token_by_link(token: str) -> Dict[str, Any]:
    """
    Verify email token from a verification link (no email required).
    Used when user clicks verification link in email.
    Returns a standardized response with email and verification status.
    """
    try:
        # Get unauthenticated client for RPC call
        supabase = get_unauthenticated_supabase_client()
        if not supabase:
            return create_standardized_response(
                message="Database connection failed",
                data={"verified": False},
                status="error"
            )
        
        # First, get the email associated with this token
        token_query = supabase.table("email_verification_requests")\
            .select("email, is_used, expires_at")\
            .eq("token", token)\
            .eq("is_used", False)\
            .single()\
            .execute()
        
        if not token_query.data:
            return create_standardized_response(
                message="Invalid or expired verification link",
                data={"verified": False},
                status="error"
            )
        
        email = token_query.data["email"]
        expires_at = token_query.data["expires_at"]
        
        # Check if token has expired
        from datetime import datetime
        try:
            # Parse the expires_at timestamp
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
            
            if datetime.utcnow() > expires_at.replace(tzinfo=None):
                return create_standardized_response(
                    message="Verification link has expired",
                    data={"email": email, "verified": False},
                    status="error"
                )
        except Exception as date_error:
            print(f"Error parsing expiration date: {date_error}")
            # Continue with verification if date parsing fails
        
        # Call the PostgreSQL function to verify and mark as used
        result = supabase.rpc('verify_email_token', {
            'p_token': token
        }).execute()
        
        print(f"PostgreSQL function result for token verification: {result}")
        
        # The function returns a boolean: True if valid, False if invalid/expired
        if result.data is True:
            return create_standardized_response(
                message="Email verified successfully",
                data={"email": email, "verified": True},
                status="success"
            )
        else:
            return create_standardized_response(
                message="Invalid or expired verification link",
                data={"email": email, "verified": False},
                status="error"
            )
            
    except Exception as e:
        print(f"Error verifying email token by link: {e}")
        return create_standardized_response(
            message="Verification failed",
            data={"verified": False},
            status="error"
        )

def create_email_verification_response(success: bool, message: str, email: str = None, token_sent: bool = False) -> Dict[str, Any]:
    """Create standardized email verification response"""
    data = {}
    if email:
        data["email"] = email
    if token_sent:
        data["token_sent"] = token_sent
        data["expires_in_minutes"] = int(os.getenv("EMAIL_VERIFICATION_EXPIRE_MINUTES", "15"))
    
    status = "success" if success else "error"
    return create_standardized_response(
        message=message,
        data=data if data else None,
        status=status
    )
