from pydantic import BaseModel

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str

class LoginForm(BaseModel):
    username: str
    password: str
    access_type: str

