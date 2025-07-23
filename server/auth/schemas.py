from pydantic import BaseModel
from typing import Optional
from datetime import date

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str

class Login(BaseModel):
    student_number: str
    password: str

class SignUp(BaseModel):
    username: str
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    email: str
    password: str
    birthdate: date
    pronouns: Optional[str] = None
    contact_number: str
    course: str
    university_branch: str
    college: str
    student_number: str
    bio: Optional[str] = None

class VerificationStatus(BaseModel):
    has_verification: bool
    status: Optional[str] = None
    documents_submitted: bool
    verification_id: Optional[int] = None
    reviewed_at: Optional[str] = None
    verified_at: Optional[str] = None
    rejection_reason: Optional[str] = None

