from supabase import create_client, Client
import os
from typing import Optional, Dict, Any
import jwt
from datetime import datetime, timedelta
from uuid import UUID
import threading
from collections import OrderedDict

# Thread-safe LRU cache with automatic cleanup
class SupabaseClientCache:
    def __init__(self, max_size: int = 100, cache_ttl_minutes: int = 5):
        self.max_size = max_size
        self.cache_ttl = timedelta(minutes=cache_ttl_minutes)
        self._cache = OrderedDict()  # For LRU behavior
        self._expiry = {}
        self._lock = threading.RLock()  # Reentrant lock for thread safety
    
    def get(self, cache_key: str) -> Optional[Client]:
        with self._lock:
            current_time = datetime.utcnow()
            
            # Clean up expired entries first
            self._cleanup_expired(current_time)
            
            if cache_key in self._cache and cache_key in self._expiry:
                if current_time < self._expiry[cache_key]:
                    # Move to end (most recently used)
                    self._cache.move_to_end(cache_key)
                    return self._cache[cache_key]
                else:
                    # Entry expired, remove it
                    self._remove_entry(cache_key)
            
            return None
    
    def put(self, cache_key: str, client: Client):
        with self._lock:
            current_time = datetime.utcnow()
            
            # Clean up expired entries first
            self._cleanup_expired(current_time)
            
            # Remove oldest entries if cache is full
            while len(self._cache) >= self.max_size:
                oldest_key = next(iter(self._cache))
                self._remove_entry(oldest_key)
            
            # Add new entry
            self._cache[cache_key] = client
            self._expiry[cache_key] = current_time + self.cache_ttl
    
    def _cleanup_expired(self, current_time: datetime):
        """Remove expired entries from cache"""
        expired_keys = [
            key for key, expiry_time in self._expiry.items()
            if current_time >= expiry_time
        ]
        for key in expired_keys:
            self._remove_entry(key)
    
    def _remove_entry(self, cache_key: str):
        """Remove entry from both cache and expiry tracking"""
        self._cache.pop(cache_key, None)
        self._expiry.pop(cache_key, None)
    
    def clear(self):
        """Clear all cached entries"""
        with self._lock:
            self._cache.clear()
            self._expiry.clear()
    
    def size(self) -> int:
        """Get current cache size"""
        with self._lock:
            return len(self._cache)

# Global cache instance
_client_cache = SupabaseClientCache(max_size=50, cache_ttl_minutes=15)


def create_supabase_compatible_jwt(user_id: UUID) -> str:
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
            "user_id": str(user_id), # Custom claim for our RLS function (as string)
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

def get_authenticated_supabase_client(user_id: Optional[UUID] = None) -> Client:
    """
    Get a Supabase client with JWT authentication for the specified user.
    Implements thread-safe LRU caching to reduce repeated client creation.
    
    Args:
        user_id: The current user's ID to create JWT token for.
                If None, returns an unauthenticated client.
        
    Returns:
        Supabase client with JWT authentication (if user_id provided)
    """
    try:
        # Create cache key
        cache_key = str(user_id) if user_id else "unauthenticated"
        
        # Try to get from cache first
        cached_client = _client_cache.get(cache_key)
        if cached_client:
            return cached_client
        
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
                # Authentication context set successfully
            except Exception as jwt_error:
                print(f"Failed to set JWT context: {jwt_error}")
                # Continue without JWT context rather than failing
        
        # Cache the client
        _client_cache.put(cache_key, client)
        
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


def clear_client_cache():
    """
    Clear the Supabase client cache.
    Useful for testing or when memory pressure is detected.
    """
    _client_cache.clear()


def get_cache_stats() -> Dict[str, int]:
    """
    Get cache statistics for monitoring.
    Returns current cache size and max size.
    """
    return {
        "current_size": _client_cache.size(),
        "max_size": _client_cache.max_size
    }
