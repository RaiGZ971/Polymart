from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
import boto3
from s3 import utils
from botocore.exceptions import ClientError
from dotenv import load_dotenv
import os

from urllib.parse import urlparse
from auth.utils import get_current_user
from core.utils import create_standardized_response
from core.config import generate_private_url, convert_s3_key_to_public_url
from supabase_client.database.users import create_user_verification_documents, update_user_verification_documents, get_user_verification_status
from supabase_client.auth_client import get_authenticated_supabase_client

load_dotenv()

router = APIRouter()
s3_client = boto3.client("s3")

@router.post("/review/{reviewee_id}")
async def upload_review_images(reviewee_id: str, images: list[UploadFile] = File(...)):
    try:
        processed_images = [utils.create_image_url("reviews", reviewee_id, image) for image in images]

        for image, file in zip(processed_images, images):
            s3_client.upload_fileobj(
                file.file,
                os.getenv("S3_BUCKET"),
                f"public/{image}",  # Add public/ prefix
                ExtraArgs={"ContentType": file.content_type}
            )

        return{"images": processed_images}

    except ClientError as e:
        raise HTTPException(status_code=e.response["responseMetadata"]["HTTPStatusCode"], detail=f"Failed to upload array images in {os.getenv('S3_BUCKET')}/public/user_documents/reviews/{reviewee_id}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload array images: {str(e)}")
    
@router.post("/message/{room_id}")
async def upload_message_image(room_id: str, image: UploadFile = File(...)):
    try:
        processed_image = utils.create_image_url("messages", room_id, image)

        s3_client.upload_fileobj(
            image.file,
            os.getenv("S3_BUCKET"),
            f"private/{processed_image}",  # Add private/ prefix
            ExtraArgs={"ContentType": image.content_type}
        )

        return {"image": processed_image}

    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to upload image in {os.getenv('S3_BUCKET')}/private/user_documents/messages/{room_id}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")

@router.patch("/user-documents/profile-photo")
async def update_profile_photo(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Update profile photo (replaces existing one) and update user profile"""
    try:
        username = current_user.get("username", "unknown")
        user_id = current_user.get("user_id")
        
        if not user_id:
            raise HTTPException(status_code=400, detail="User ID not found in authentication context")
        
        # Get current user profile to check for existing photo
        from supabase_client.database.users import get_user_by_id, update_user_profile
        current_profile = await get_user_by_id(user_id, include_private=True)
        
        old_photo_url = None
        if current_profile and current_profile.get("profile_photo_url"):
            old_photo_url = current_profile["profile_photo_url"]
            print(f"Found existing profile photo for user {username}: {old_photo_url}")
        
        # Upload new file to S3
        new_file_url = await utils.upload_file_with_metadata(
            file=file,
            document_type="profile_photo",
            folder_prefix="user_documents/profile",
            is_public=True,
            default_ext="jpg",
            context_info=f"user: {username}"
        )
        
        # Update user profile with the new photo URL
        update_result = await update_user_profile(
            user_id=user_id,
            update_data={"profile_photo_url": new_file_url}
        )
        
        if not update_result:
            # If database update fails, try to clean up the new file
            try:
                s3_key = utils.extract_s3_key_from_url(new_file_url)
                await utils.delete_file_from_s3(s3_key)
            except:
                pass  # Don't fail if cleanup fails
            raise HTTPException(status_code=500, detail="Failed to update profile photo in database")
        
        # Delete old profile photo if it exists (only after successful database update)
        if old_photo_url:
            try:
                old_s3_key = utils.extract_s3_key_from_url(old_photo_url)
                deleted = await utils.delete_file_from_s3(old_s3_key)
                if deleted:
                    print(f"Successfully deleted old profile photo: {old_s3_key}")
                else:
                    print(f"Warning: Failed to delete old profile photo: {old_s3_key}")
            except Exception as e:
                print(f"Warning: Error deleting old profile photo {old_photo_url}: {e}")
                # Don't fail the entire operation if old file deletion fails
        
        return create_standardized_response(
            message="Profile photo updated successfully",
            data={
                "file_url": new_file_url,
                "old_photo_deleted": old_photo_url is not None
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update profile photo: {str(e)}")

@router.delete("/user-documents/profile-photo")
async def delete_profile_photo(
    current_user: dict = Depends(get_current_user)
):
    """Delete user's profile photo and remove from profile"""
    try:
        username = current_user.get("username", "unknown")
        user_id = current_user.get("user_id")
        
        if not user_id:
            raise HTTPException(status_code=400, detail="User ID not found in authentication context")
        
        # Get current user profile to check for existing photo
        from supabase_client.database.users import get_user_by_id, update_user_profile
        current_profile = await get_user_by_id(user_id, include_private=True)
        
        if not current_profile or not current_profile.get("profile_photo_url"):
            raise HTTPException(status_code=404, detail="No profile photo found to delete")
        
        photo_url = current_profile["profile_photo_url"]
        
        # Update user profile to remove photo URL
        update_result = await update_user_profile(
            user_id=user_id,
            update_data={"profile_photo_url": None}
        )
        
        if not update_result:
            raise HTTPException(status_code=500, detail="Failed to remove profile photo from database")
        
        # Delete the file from S3
        try:
            s3_key = utils.extract_s3_key_from_url(photo_url)
            deleted = await utils.delete_file_from_s3(s3_key)
            if not deleted:
                print(f"Warning: Failed to delete profile photo file from S3: {s3_key}")
        except Exception as e:
            print(f"Warning: Error deleting profile photo file {photo_url}: {e}")
            # Don't fail the entire operation if file deletion fails
        
        return create_standardized_response(
            message="Profile photo deleted successfully",
            data={"deleted_photo_url": photo_url}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete profile photo: {str(e)}")

@router.post("/user-documents/verification-documents")
async def submit_verification_documents(
    student_id_front: UploadFile = File(...),
    student_id_back: UploadFile = File(...),
    cor_file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Submit verification documents for users who signed up without them.
    This creates or updates the user_verification table entry.
    """
    try:
        user_id = current_user.get("user_id")
        username = current_user.get("username", "unknown")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid user token")
        
        # Upload all verification documents
        documents_to_upload = [
            (student_id_front, "student_id_front"),
            (student_id_back, "student_id_back"),
            (cor_file, "cor")
        ]
        
        verification_documents = {}
        for file, doc_type in documents_to_upload:
            default_ext = "pdf" if doc_type == "cor" else "jpg"
            url = await utils.upload_file_with_metadata(
                file, doc_type, "user_documents/verification", 
                is_public=False, default_ext=default_ext, context_info=f"user: {username}"
            )
            verification_documents[f"{doc_type}_url"] = url
        
        # Check if user already has verification documents
        existing_verification = await get_user_verification_status(user_id)
        
        verification_result = None
        if existing_verification:
            # Update existing verification
            verification_result = await update_user_verification_documents(user_id, verification_documents)
            message = "Verification documents updated successfully"
        else:
            # Create new verification entry
            verification_result = await create_user_verification_documents(user_id, verification_documents)
            message = "Verification documents submitted successfully"
        
        if not verification_result:
            raise HTTPException(status_code=500, detail="Failed to store verification documents")
        
        return create_standardized_response(
            message=message,
            data={
                "verification_id": verification_result.get("verification_id"),
                "status": verification_result.get("status", "pending"),
                "documents_uploaded": True
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit verification documents: {str(e)}")

@router.post("/listing-images/{listing_id}")
async def upload_listing_images(
    listing_id: int,
    images: list[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload multiple images for a product listing and store URLs in database"""
    try:
        user_id = current_user.get("user_id")
        username = current_user.get("username", "unknown")
        uploaded_images = []
        
        # Get authenticated Supabase client
        supabase = get_authenticated_supabase_client(user_id)
        if not supabase:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        # First, verify the listing belongs to the current user
        listing_check = supabase.table("listings").select("seller_id").eq("listing_id", listing_id).execute()
        if not listing_check.data or listing_check.data[0]["seller_id"] != user_id:
            raise HTTPException(status_code=403, detail="You can only upload images for your own listings")
        
        for i, image in enumerate(images):
            # Upload image to S3 (public bucket for listing images)
            file_url = await utils.upload_file_with_metadata(
                file=image,
                document_type=f"listing_image_{i+1}",
                folder_prefix=f"user_documents/listings/{listing_id}",
                is_public=True,
                default_ext="jpg",
                context_info=f"user: {username}, listing: {listing_id}"
            )
            
            # Store the image URL in the database
            is_primary = i == 0  # First image is primary
            image_data = {
                "listing_id": listing_id,
                "image_url": file_url,
                "is_primary": is_primary
            }
            
            # Insert into listing_images table
            db_result = supabase.table("listing_images").insert(image_data).execute()
            
            uploaded_image = {
                "image_url": file_url,
                "is_primary": is_primary
            }
            
            if db_result.data:
                uploaded_image["image_id"] = db_result.data[0]["image_id"]
            else:
                # If database insert fails, we should still return the URL but log the error
                print(f"Warning: Failed to store image URL in database for listing {listing_id}")
                uploaded_image["image_id"] = None
            
            uploaded_images.append(uploaded_image)
        
        return create_standardized_response(
            message=f"Successfully uploaded {len(uploaded_images)} listing images",
            data={"images": uploaded_images}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload listing images: {str(e)}")

@router.get("/user-documents/verification-documents")
async def get_verification_documents(
    current_user: dict = Depends(get_current_user)
):
    """Get the current user's verification documents with signed URLs"""
    try:
        user_id = current_user.get("user_id")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid user token")
        
        verification_status = await get_user_verification_status(user_id)
        
        if not verification_status:
            raise HTTPException(status_code=404, detail="No verification documents found")
        
        # Generate signed URLs for all verification documents
        document_fields = [
            ("student_id_front_url", "student_id_front", "Student ID (Front)"),
            ("student_id_back_url", "student_id_back", "Student ID (Back)"),
            ("cor_url", "cor", "Certificate of Registration (COR)")
        ]
        
        documents = {}
        for field_key, doc_key, doc_type in document_fields:
            if verification_status.get(field_key):
                try:
                    documents[doc_key] = {
                        "url": utils.generate_presigned_url(verification_status[field_key]),
                        "s3_key": verification_status[field_key],
                        "document_type": doc_type
                    }
                except Exception as e:
                    print(f"Error generating signed URL for {doc_key}: {e}")
                    documents[doc_key] = {
                        "url": None,
                        "s3_key": verification_status[field_key],
                        "document_type": doc_type,
                        "error": "Failed to generate signed URL"
                    }
        
        if not documents:
            raise HTTPException(status_code=404, detail="No verification documents found")
        
        return create_standardized_response(
            message="Verification documents retrieved successfully",
            data={
                "verification_id": verification_status.get("verification_id"),
                "status": verification_status.get("status"),
                "documents": documents,
                "note": "Signed URLs expire in 1 hour"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get verification documents: {str(e)}")

@router.get("/user-documents/verification-status")
async def get_verification_status(
    current_user: dict = Depends(get_current_user)
):
    """Get the current user's verification status and document information with signed URLs"""
    try:
        user_id = current_user.get("user_id")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid user token")
        
        verification_status = await get_user_verification_status(user_id)
        
        if not verification_status:
            return create_standardized_response(
                message="No verification documents found",
                data={
                    "has_verification": False,
                    "status": None,
                    "documents_submitted": False
                }
            )
        
        # Generate signed URLs for private verification documents
        response_data = {
            "has_verification": True,
            "verification_id": verification_status.get("verification_id"),
            "status": verification_status.get("status"),
            "documents_submitted": True,
            "reviewed_at": verification_status.get("reviewed_at"),
            "verified_at": verification_status.get("verified_at"),
            "rejection_reason": verification_status.get("rejection_reason")
        }
        
        # Add signed URLs for the verification documents if they exist
        document_fields = [
            ("student_id_front_url", "student_id_front_url"),
            ("student_id_back_url", "student_id_back_url"),
            ("cor_url", "cor_url")
        ]
        
        for field_key, response_key in document_fields:
            if verification_status.get(field_key):
                try:
                    response_data[response_key] = generate_private_url(verification_status[field_key])
                except Exception as e:
                    print(f"Error generating signed URL for {field_key}: {e}")
                    response_data[response_key] = None
        
        return create_standardized_response(
            message="Verification status retrieved successfully",
            data=response_data
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get verification status: {str(e)}")

@router.get("/presigned-url/{s3_key:path}")
async def get_presigned_url(
    s3_key: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a presigned URL for accessing a private S3 object"""
    try:
        presigned_url = utils.generate_presigned_url(s3_key)
        
        return create_standardized_response(
            message="Presigned URL generated successfully",
            data={"presigned_url": presigned_url}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate presigned URL: {str(e)}")

@router.post("/migrate-image-urls")
async def migrate_image_urls(
    current_user: dict = Depends(get_current_user)
):
    """
    Utility endpoint to migrate any S3 keys to proper URLs in the listing_images table.
    This helps fix any existing data that might have S3 keys instead of full URLs.
    """
    try:
        user_id = current_user.get("user_id")
        
        # Get authenticated Supabase client
        supabase = get_authenticated_supabase_client(user_id)
        if not supabase:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        # Get all listing images for user's listings that might need migration
        user_listings = supabase.table("listings").select("listing_id").eq("seller_id", user_id).execute()
        
        if not user_listings.data:
            return create_standardized_response(
                message="No listings found for current user",
                data={"migrated_count": 0}
            )
        
        listing_ids = [listing["listing_id"] for listing in user_listings.data]
        
        # Get listing images that might need migration (URLs that don't start with https://)
        images_result = supabase.table("listing_images").select("*").in_("listing_id", listing_ids).execute()
        
        migrated_count = 0
        
        if images_result.data:
            for image_record in images_result.data:
                image_url = image_record["image_url"]
                
                # Check if it's an S3 key that needs conversion
                if not image_url.startswith(("https://", "http://")):
                    try:
                        # Convert S3 key to proper public URL
                        new_url = convert_s3_key_to_public_url(image_url)
                        
                        # Update the record
                        update_result = supabase.table("listing_images").update({
                            "image_url": new_url
                        }).eq("image_id", image_record["image_id"]).execute()
                        
                        if update_result.data:
                            migrated_count += 1
                    except Exception as e:
                        print(f"Failed to migrate image_id {image_record['image_id']}: {e}")
        
        return create_standardized_response(
            message=f"Migration completed. {migrated_count} image URLs were updated.",
            data={"migrated_count": migrated_count}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to migrate image URLs: {str(e)}")

@router.delete("/message")
async def delete_message_image(image: str):
    try:
        parsedImage = urlparse(image)
        key = parsedImage.path.lstrip("/")

        s3_client.delete_object(
            Bucket=os.getenv("S3_BUCKET"),
            Key=f"private/{key}"  # Add private/ prefix if not already present
        )

        return{"image deleted": key}
    
    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to delete image message in {os.getenv('S3_BUCKET')}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete image message: {str(e)}")
    
@router.delete("/review-images")
async def delete_review_images(images: list[str]):
    try:
        parsedImages = [urlparse(image) for image in images]
        keys = [f"public/{parsedImage.path.lstrip('/')}" for parsedImage in parsedImages]  # Add public/ prefix
    
        s3_client.delete_objects(
            Bucket=os.getenv("S3_BUCKET"), 
            Delete={"Objects": [{"Key": key} for key in keys]}
        )

        return {"images deleted": keys}
    
    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to delete images review in {os.getenv('S3_BUCKET')}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete images in review: {str(e)}")

@router.delete("/review-image")
async def delete_review_image(image: str):
    try:
        parsedImage = urlparse(image)
        key = parsedImage.path.lstrip("/")

        s3_client.delete_object(
            Bucket=os.getenv("S3_BUCKET"),
            Key=f"public/{key}"  # Add public/ prefix
        )

        return {"image deleted": key}
    
    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to delete image review in {os.getenv('S3_BUCKET')}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete image review: {str(e)}")