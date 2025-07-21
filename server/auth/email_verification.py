import os
import secrets
import smtplib
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict, Any
from supabase_client.auth_client import get_unauthenticated_supabase_client
from core.utils import create_standardized_response
from dotenv import load_dotenv

load_dotenv()

def generate_verification_token() -> str:
    """Generate a secure 6-digit verification token"""
    return str(secrets.randbelow(900000) + 100000)

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
        
        # Set expiration (15 minutes from now)
        expires_at = datetime.utcnow() + timedelta(minutes=15)
        
                # Get unauthenticated client (anyone can create verification requests)
        supabase = get_unauthenticated_supabase_client()
        if not supabase:
            print("Failed to get Supabase client")
            return None
        
        print(f"Creating verification request for email: {email}")
        print(f"Token: {token}")
        print(f"Expires at: {expires_at.isoformat()}")
        
        # For now, just create a new verification request
        # (Skip checking for existing tokens to simplify)
        verification_data = {
            "email": email,
            "token": token,
            "expires_at": expires_at.isoformat(),
            "is_used": False
        }
        
        try:
            result = supabase.table("email_verification_requests")\
                .insert(verification_data)\
                .execute()
            print(f"Insert result: {result}")
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

async def send_verification_email(email: str, token: str) -> bool:
    """
    Send verification email with the token.
    Returns True if successful, False otherwise.
    """
    try:
        # Email configuration from environment variables
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        sender_email = os.getenv("SENDER_EMAIL")
        sender_password = os.getenv("SENDER_PASSWORD")
        
        if not sender_email or not sender_password:
            print("Email configuration missing")
            return False
        
        # FOR TESTING: Still print the token to console for debugging
        print(f"=== EMAIL VERIFICATION TOKEN ===")
        print(f"Email: {email}")
        print(f"Token: {token}")
        print(f"=== SENDING EMAIL NOW ===")
        
        # Now attempt to send the actual email
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = "Verify Your Email - Polymart"
        message["From"] = sender_email
        message["To"] = email
        
        # HTML email content
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verification</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Polymart!</h1>
                <p style="color: #f0f0f0; margin: 10px 0 0 0;">Your campus marketplace awaits</p>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #333; margin-top: 0;">Verify Your Email Address</h2>
                <p>Thank you for signing up! To complete your registration, please enter the verification code below:</p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0; border: 2px dashed #667eea;">
                    <h3 style="margin: 0; color: #667eea; font-size: 32px; letter-spacing: 8px; font-weight: bold;">{token}</h3>
                    <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">This code expires in 15 minutes</p>
                </div>
                
                <p style="color: #666; font-size: 14px; margin-top: 25px;">
                    If you didn't request this verification, please ignore this email.
                </p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
                    <p style="color: #999; font-size: 12px; margin: 0;">
                        This email was sent from Polymart. Please do not reply to this email.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Plain text fallback
        text_content = f"""
        Welcome to Polymart!
        
        Thank you for signing up! To complete your registration, please enter the verification code below:
        
        Verification Code: {token}
        
        This code expires in 15 minutes.
        
        If you didn't request this verification, please ignore this email.
        """
        
        # Create MIMEText objects
        text_part = MIMEText(text_content, "plain")
        html_part = MIMEText(html_content, "html")
        
        # Add parts to message
        message.attach(text_part)
        message.attach(html_part)
        
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

def create_email_verification_response(success: bool, message: str, email: str = None, token_sent: bool = False) -> Dict[str, Any]:
    """Create standardized email verification response"""
    data = {}
    if email:
        data["email"] = email
    if token_sent:
        data["token_sent"] = token_sent
        data["expires_in_minutes"] = 15
    
    status = "success" if success else "error"
    return create_standardized_response(
        message=message,
        data=data if data else None,
        status=status
    )
