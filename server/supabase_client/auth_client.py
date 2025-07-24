from supabase import create_client, Client
import os
from typing import Optional, Dict, Any
import jwt
from datetime import datetime, timedelta


def create_supabase_compatible_jwt(user_id: int) -> str:
    """
    Create a JWT token that Supabase RLS can understand.
    This uses Supabase's JWT secret so RLS can read the user_id claim.
    """
    try:
        # Try Supabase JWT secret first, fall back to app secret
        secret_key = os.getenv("SUPABASE_JWT_SECRET") or os.getenv("SECRET_KEY")
        if not secret_key:
            raise ValueError("SUPABASE_JWT_SECRET or SECRET_KEY environment variable not found")
        
        # Create payload that Supabase RLS can understand
        payload = {
            "sub": str(user_id),     # Standard JWT subject claim
            "user_id": user_id,      # Custom claim for our RLS function
            "iss": "fastapi-auth",   # Issuer
            "aud": "authenticated",  # Audience - Supabase expects this
            "role": "authenticated", # Supabase role
            "iat": datetime.utcnow(),
            "exp": datetime.utcnow() + timedelta(hours=1)
        }
        
        return jwt.encode(payload, secret_key, algorithm="HS256")
    except Exception as e:
        print(f"Error creating Supabase-compatible JWT: {e}")
        return None

def get_authenticated_supabase_client(user_id: Optional[int] = None) -> Client:
    """
    Get a Supabase client with JWT authentication for the specified user.
    
    Args:
        user_id: The current user's ID to create JWT token for.
                If None, returns an unauthenticated client.
        
    Returns:
        Supabase client with JWT authentication (if user_id provided)
    """
    try:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_ANON_KEY") 
        
        if not url or not key:
            print(f"Missing Supabase credentials: URL={url}, KEY={'present' if key else 'missing'}")
            return None
            
        # Create the client
        client = create_client(url, key)
        
        # Set the user context for RLS if user_id is provided
        if user_id is not None:
            # Create JWT token for the user
            jwt_token = create_supabase_compatible_jwt(user_id)
            if not jwt_token:
                print("Failed to create JWT token")
                return client  # Return client without auth rather than None
            
            try:
                # Set the JWT token in the client's headers for postgrest
                client.postgrest.auth(jwt_token)
                print(f"Set authentication context for user_id: {user_id}")
            except Exception as jwt_error:
                print(f"Failed to set JWT context: {jwt_error}")
                # Continue without JWT context rather than failing
            
        return client
    except Exception as e:
        print(f"Error creating authenticated Supabase client: {e}")
        return None
    
def get_unauthenticated_supabase_client() -> Client:
    """
    Get a Supabase client without authentication context.
    Useful for operations that don't require authentication like signup.
    This is now a convenience function that calls get_authenticated_supabase_client(None).
    """
    return get_authenticated_supabase_client(None)

def get_service_role_supabase_client() -> Optional[Client]:
    """
    Get a Supabase client with service role privileges (bypasses RLS).
    Use only for specific operations like email verification that need to bypass RLS.
    """
    try:
        supabase_url = os.getenv("SUPABASE_URL")
        service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not service_role_key:
            print("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables")
            return None
        
        return create_client(supabase_url, service_role_key)
    except Exception as e:
        print(f"Error creating service role Supabase client: {e}")
        return None
