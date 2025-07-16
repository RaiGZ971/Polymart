from fastapi import FastAPI, Depends
from auth import utils, schemas
from supabase.schemas import User

router = FastAPI(title="Auth API", description="Responsible for handling user authentication using PyJWT")

# @router.get("/me")
# def read_current_user(current_user: User = Depends(get_current_user)):
