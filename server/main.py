from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# from supabase.routes import router as supabase_router
from dynamodb.routes import router as dynamodb_router
from auth.routes import router as auth_router
from s3.routes import router as s3_router

app = FastAPI()

origin = [
    "http://localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origin,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]

)

# app.include_router(supabase_router, prefix="/supabase", tags=["Supabase"])
app.include_router(dynamodb_router, prefix="/dynamodb", tags=["DyanamoDB"])
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(s3_router, prefix="/s3", tags=["S3 Bucket"])