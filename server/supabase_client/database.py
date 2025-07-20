from supabase import create_client, Client
import os
from dotenv import load_dotenv
from typing import Optional, Dict, Any

# Load .env from the correct path
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(env_path)

url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_KEY")

from supabase import create_client, Client
import os

from supabase import create_client, Client
import os
from dotenv import load_dotenv
from typing import Optional, Dict, Any

# Load .env from the correct path
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(env_path)

def get_supabase_client() -> Client:
    try:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_ANON_KEY") 
        
        if not url or not key:
            print(f"Missing Supabase credentials: URL={url}, KEY={'present' if key else 'missing'}")
            return None
            
        # Simple client creation with supabase 2.0.0
        return create_client(url, key)
    except Exception as e:
        print(f"Error creating Supabase client: {e}")
        return None

async def create_user_profile(user_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Create a new user profile in the database
    """
    try:
        supabase = get_supabase_client()
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
    Create user verification documents entry
    """
    try:
        supabase = get_supabase_client()
        if not supabase:
            print("Failed to get Supabase client")
            return None
        
        verification_data = {
            "user_id": user_id,
            **document_urls
        }
        
        result = supabase.table("user_verified").insert(verification_data).execute()
        
        if result.data:
            return result.data[0]
        return None
    except Exception as e:
        print(f"Error creating user verification documents: {e}")
        return None

async def get_user_by_student_number(student_number: str) -> Optional[Dict[str, Any]]:
    """
    Get a user profile by student number
    """
    try:
        supabase = get_supabase_client()
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
