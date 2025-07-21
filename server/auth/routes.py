from fastapi import APIRouter, Depends, HTTPException
from auth import utils, models
from supabase.schemas import User

router = APIRouter()

@router.get("/")
async def root():
    return ("auth route is running...")

@router.post("/login", response_model=models.Token)
async def get_signed_account(form: models.LoginForm):
    try:
        return ("testing")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch notes: {str(e)}")


# @router.get("/me")
# def read_current_user(current_user: User = Depends(get_current_user)):