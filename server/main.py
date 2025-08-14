from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from supabase_client.routes import router as supabase_router
from dynamodb.routes import router as dynamodb_router
from auth.routes import router as auth_router
from s3.routes import router as s3_router
from core.utils import log_request_performance
import os
import time

app = FastAPI()

# Performance monitoring middleware
@app.middleware("http")
async def performance_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    response_time = time.time() - start_time
    
    # Log slow requests
    log_request_performance(request, response_time)
    
    # Add performance header
    response.headers["X-Response-Time"] = str(response_time)
    
    return response

# Get frontend URL from environment variables
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

origin = [
    frontend_url,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://polymart.club",
    "https://polymart.club",
    "https://www.polymart.club",
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

app.include_router(supabase_router, prefix="/supabase", tags=["Supabase"])
app.include_router(dynamodb_router, prefix="/dynamodb", tags=["DyanamoDB"])
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(s3_router, prefix="/s3", tags=["S3 File Uploads"])

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": time.time()}
