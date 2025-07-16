from datetime import datetime, timezone
import jwt
import hashlib
from dotenv import load_dotenv
import os

load_dotenv()

def get_hashed_password(pwd):
    pwd_salt = pwd + os.getenv("PWD_SALT")
    hashed = hashlib.sha256(pwd_salt.encode())
    
    return hashed