from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi import Request
from supabase_client.routes import router as supabase_router
from dynamodb.routes import router as dynamodb_router
from auth.routes import router as auth_router
from s3.routes import router as s3_router
import os

app = FastAPI()

# Get frontend URL from environment variables
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

origin = [
    frontend_url
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origin,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Mount static files for templates
app.mount("/static", StaticFiles(directory="templates"), name="static")

# Initialize Jinja2 templates
templates = Jinja2Templates(directory="templates")

# Route to serve the email verification result page
@app.get("/email-verified", response_class=HTMLResponse)
async def email_verified(request: Request):
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    backend_url = os.getenv("BACKEND_URL", "http://localhost:8000")
    
    return templates.TemplateResponse("email-verified.html", {
        "request": request,
        "frontend_url": frontend_url,
        "backend_url": backend_url
    })

# app.include_router(supabase_router, prefix="/supabase", tags=["Supabase"])
app.include_router(dynamodb_router, prefix="/dynamodb", tags=["DyanamoDB"])
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(s3_router, prefix="/s3", tags=["S3 File Uploads"])
