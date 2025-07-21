import boto3
from dotenv import load_dotenv
import os
from botocore.exceptions import ClientError
from fastapi import HTTPException



load_dotenv()

#Create Client
s3Client = boto3.client("s3")

def generate_private_urls(images: list[str]) -> list[str]:
    try:
        urls = []

        for image in images:
            url = s3Client.generate_presigned_url(
                "get_object",
                Params={"Bucket": os.getenv("S3_PRIVATE_BUCKET"), "Key": image},
                ExpiresIn=3600
            )
            urls.append(url)

        return urls
    
    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to generate private urls in {os.getenv("S3_PRIVATE_BUCKET")}: {e.response["Error"]["Message"]}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate private urls: {str(e)}")
    
def generate_private_url(image: str) -> str:
    try:
        url = s3Client.generate_presigned_url(
            "get_object",
            Params={"Bucket": os.getenv("S3_PRIVATE_BUCKET"), "Key": image},
            ExpiresIn=3600
        )

        return url

    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to generate private url in {os.getenv("S3_PRIVATE_BUCKET")}: {e.response["Error"]["Message"]}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate private url: {str(e)}")
    
def generate_public_urls(images: list[str]) -> list[str]:
    try:
        urls = [f"https://{os.getenv("S3_PUBLIC_BUCKET")}.s3.{os.getenv("AWS_REGION")}.amazonaws.com/{image}" for image in images]

        return urls
    
    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to generate public url in {os.getenv("S3_PUBLIC_BUCKET")}: {e.response["Error"]["Message"]}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate public url: {str(e)}")
    
def generate_public_url(image: str) -> str:
    try:
        url = f"https://{os.getenv("S3_PUBLIC_BUCKET")}.s3.{os.getenv("AWS_REGION")}.amazonaws.com/{image}"
        
        return url
        
    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to generate public url in {os.getenv("S3_PUBLIC_BUCKET")}: {e.response["Error"]["Message"]}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate public url: {str(e)}")
    

   
   
        
    
            

    return
