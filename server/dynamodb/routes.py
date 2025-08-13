from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, UploadFile, File, Depends
from fastapi.responses import HTMLResponse
from dotenv import load_dotenv

load_dotenv()

import boto3
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError
from dynamodb import client, utils, models
from core import config
from s3 import utils as s3Utlis
from auth.utils import get_current_user
import os
import json


router = APIRouter()
manager = client.ConnectionManager()

html = """
<!DOCTYPE html>
<html>
<head>
    <title>Chat</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        #chat-box { border: 1px solid #ccc; padding: 10px; height: 400px; overflow-y: scroll; margin-bottom: 10px; }
        .message { margin: 5px 0; padding: 5px 10px; border-radius: 10px; max-width: 70%; }
        .you { background-color: #dcf8c6; text-align: right; margin-left: auto; }
        .them { background-color: #f1f0f0; text-align: left; margin-right: auto; }
    </style>
</head>
<body>
    <h1>WebSocket Chat</h1>
    <h3>You: <span id="ws-id"></span></h3>
    <div id="chat-box"></div>

    <form onsubmit="sendMessage(event)">
        <input type="text" id="messageText" autocomplete="off" style="width: 60%;" />
        <input type="file" id="imageFile" accept="image/*" style="width: 20%;" />
        <button type="submit">Send</button>
    </form>

    <script>
        const room_id = "{{room_id}}";
        const sender_id = "{{sender_id}}";
        const receiver_id = "{{receiver_id}}";
        const chatBox = document.getElementById("chat-box");

        document.getElementById("ws-id").textContent = sender_id;

        const ws = new WebSocket(`ws://127.0.0.1:8000/dynamodb/message/${room_id}/${sender_id}/${receiver_id}`);
        console.log("WebSocket URL:", ws.url);

        // Display new messages
        ws.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);

                appendMessage(data);  // will use correct sender_id
            } catch (err) {
                console.error("Invalid JSON message:", event.data);
            }
        };

        async function sendMessage(event) {
            event.preventDefault();
            const input = document.getElementById("messageText");
            const fileInput = document.getElementById("imageFile");
            const text = input.value.trim();
            const file = fileInput.files[0];

            if (file) {
                const formData = new FormData();
                formData.append("image", file);

                const response = await fetch(`/dynamodb/message-image/${room_id}`, {
                    method: "POST",
                    body: formData
                });

                const data = await response.json();

                ws.send(JSON.stringify({
                    sender_id,
                    image: data.image
                }));

                fileInput.value = "";  // Reset
            }
            
            if (text !== "") {

                ws.send(JSON.stringify({
                    sender_id,
                    content: text
                }));
                input.value = "";
            }
        }

        function appendMessage(msgJSON) {
            const data = typeof msgJSON === 'string' ? JSON.parse(msgJSON) : msgJSON;

            const msgDiv = document.createElement("div");

            msgDiv.className = "message " + (data.sender_id === sender_id ? "you" : "them");
            msgDiv.id = data.message_id

            if(data.image){
                const img = document.createElement("img");
                img.src = data.image;
                img.style.maxWidth = "200px";
                img.style.display = "block"
                msgDiv.appendChild(img);
            }

            if(data.content){
                const text = document.createElement("p");
                text.textContent = data.content;
                msgDiv.appendChild(text);
            }

            chatBox.appendChild(msgDiv);
            chatBox.scrollTop = chatBox.scrollHeight;
        }

        // Fetch past messages
        async function fetchMessages() {
            try {
                const response = await fetch(`/dynamodb/messages/${sender_id}/${receiver_id}`);
                const data = await response.json();

                // Sort by created_at
                data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

                data.forEach(msg => {
                    appendMessage(msg);
                });
            } catch (err) {
                console.error("Failed to fetch history:", err);
            }
        }

        fetchMessages();
    </script>
</body>
</html>
"""

# Create client
s3Client = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")
tableMessage = dynamodb.Table("hackybara-message") #type:ignore
tableReport = dynamodb.Table("hackybara-report") #type:ignore
tableReview = dynamodb.Table("hackybara-review") #type:ignore
tableNotification = dynamodb.Table("hackybara-notification") #type:ignore

#TEMPORARY
@router.post("/message-image/{room_id}")
async def upload_message_image(room_id: str, image: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    try:
        processed_image = s3Utlis.create_image_url("messages", room_id, image)

        s3Client.upload_fileobj(
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
    
#CHATTING SYSTEM
@router.websocket("/message/{room_id}/{sender_id}/{receiver_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, sender_id: str, receiver_id: str):
    await manager.connect(websocket, room_id)
    try:
        while True:
            data = await websocket.receive_text()
            print(f"📨 Received WebSocket data: {data}")
            
            try:
                msg = json.loads(data)
                print(f"📋 Parsed message: {msg}")

                content = msg.get("content")
                image = msg.get("image")
                productID = msg.get("productID")

                form = models.raw_message(
                    sender_id=sender_id,
                    receiver_id=receiver_id,
                    product_id=productID,
                    content=content if content else None,
                    image=image if image else None
                )

                processedForm = utils.process_message_form(room_id, form)

                image_url = config.generate_private_url(image) if image else None
                
                broadcast_data = {
                    "sender_id": sender_id,
                    "product_id": productID,
                    "content": content,
                    "image": image_url,
                    "message_id": processedForm.message_id
                }
                print(f"📡 Broadcasting: {broadcast_data}")
                
                await manager.broadcast(broadcast_data, room_id)
                print(f"✅ Message broadcasted to room: {room_id}")
                
            except json.JSONDecodeError as e:
                print(f"❌ JSON decode error: {e}")
                await websocket.send_text(json.dumps({"error": "Invalid JSON format"}))
            except Exception as e:
                print(f"❌ Message processing error: {e}")
                await websocket.send_text(json.dumps({"error": f"Message processing failed: {str(e)}"}))

    except WebSocketDisconnect:
        print(f"🔌 WebSocket disconnected from room: {room_id}")
        manager.disconnect(websocket, room_id)
    except Exception as e:
        print(f"❌ Unexpected WebSocket error: {e}")
        manager.disconnect(websocket, room_id)

@router.get("/messages/{sender_id}/{receiver_id}")
async def get_messages(sender_id: str, receiver_id: str, current_user: dict = Depends(get_current_user)):
    room_id = utils.get_room(sender_id, receiver_id)

    try:
        query = tableMessage.query(
            KeyConditionExpression=Key("room_id").eq(room_id),
            FilterExpression=Attr("content").exists(),
            ScanIndexForward=True
        )

        messages = query.get("Items", [])

        query = tableMessage.query(
            KeyConditionExpression=Key("room_id").eq(room_id),
            FilterExpression=Attr("image").exists(),
            ScanIndexForward=True
        )

        imageMessages = query.get("Items", [])

        URLs = []
        for message in imageMessages:
            URLs.append(message["image"])

        processedURLs = config.generate_private_urls(URLs)

        for message, url in zip(imageMessages, processedURLs):
            message["image"] = url

        allMessages: list[dict] = messages + imageMessages
        allMessages.sort(key=lambda x: x["created_at"])

        return allMessages
    
    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to fetch messages in hackybara-message: {e.response["Error"]["Message"]}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to review messages: {str(e)}")
    
@router.get("/message/{room_id}/{message_id}", response_model=models.message)
async def get_message(room_id: str, message_id: str, current_user: dict = Depends(get_current_user)):
    try:
        query = tableMessage.query(
            KeyConditionExpression=Key("room_id").eq(room_id),
            FilterExpression=Attr("message_id").eq(message_id)
        )

        message = query.get("Items", [])[0]
        print(f"test:")
        return message
    
    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to fetch message in hackybara-message: {e.response["Error"]["Message"]}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to review message: {str(e)}")
    
@router.get("/chat/{sender_id}/{receiver_id}", response_class=HTMLResponse)
async def serve_chat_html(sender_id: str, receiver_id: str, current_user: dict = Depends(get_current_user)):
    room_id = utils.get_room(sender_id, receiver_id)
    html_with_room = html.replace("{{room_id}}", room_id)\
                         .replace("{{sender_id}}", sender_id)\
                         .replace("{{receiver_id}}", receiver_id)
    return HTMLResponse(html_with_room)

@router.get("/contacts/{user_id}")
async def get_contacts(user_id: str, current_user: dict = Depends(get_current_user)):
    try:
        response = tableMessage.scan(
            FilterExpression=Attr("room_id").contains(user_id)
        )

        sortedItems = sorted(response["Items"], key=lambda x: x["created_at"], reverse=True)

        seen = set()

        roomIDs = []
        latestMessages = []
        latestProductIDs = []

        for item in sortedItems:
            room_id = item.get("room_id")
            if room_id not in seen:
                seen.add(room_id)
                roomIDs.append(room_id)
                latestMessages.append({
                    "senderID": item.get("sender_id"),
                    "message": item.get("content") or "sent a message",
                    "sent": item.get("updated_at"),
                    "readStatus": item.get("read_status") 
                    })
                latestProductIDs.append(item.get("product_id"))

        contacts = [roomID.replace(user_id, "") for roomID in roomIDs]

        return {"contacts": contacts, "latest_messages": latestMessages, "products": latestProductIDs}
    
    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to fetch rooms in hackybara-message: {e.response["Error"]["Message"]}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch rooms: {str(e)}")
    
@router.post("/message/{room_id}", response_model=models.message)
async def upload_message(room_id: str, form: models.raw_message, current_user: dict = Depends(get_current_user)):
    try:
        processedForm = utils.process_message_form(room_id, form)

        tableMessage.put_item(
            Item=processedForm.model_dump(exclude_none=True)
        )

        return processedForm
    
    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to upload message in hackybara-message: {e.response["Error"]["Message"]}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload message: {str(e)}")

@router.put("/message-update/{room_id}/{message_id}", response_model=models.message)
async def update_message(room_id: str, message_id: str, content: str, current_user: dict = Depends(get_current_user)):
    currentDate = utils.get_current_date()
    try:
        query = tableMessage.query(
            KeyConditionExpression=Key("room_id").eq(room_id),
            FilterExpression=Attr("message_id").eq(message_id)
        )

        message = query.get("Items", [])[0]

        response = tableMessage.update_item(
            Key={"room_id": room_id, "created_at": message["created_at"]},
            ConditionExpression=Attr("message_id").eq(message_id),
            UpdateExpression="set content=:content, updated_at=:updated_at",
            ExpressionAttributeValues={":content": content, ":updated_at": currentDate},
            ReturnValues="ALL_NEW"
        )

        return models.message(**response["Attributes"])        
    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to fetch in hackybara-message: {e.response["Error"]["Message"]}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to review: {str(e)}")
    
@router.put("/messages-status-updates/{sender_id}/{receiver_id}")
async def update_status_messages(sender_id: str, receiver_id: str, current_user: dict = Depends(get_current_user)):
    room_id = utils.get_room(sender_id, receiver_id)
    updatedMessages = []

    try:
        query = tableMessage.query(
            KeyConditionExpression=Key("room_id").eq(room_id),
            FilterExpression=Attr("receiver_id").eq(sender_id) & Attr("read_status").eq(False)
        )

        unreadMessages = query.get("Items", [])

        keys = [{"room_id": room_id, "created_at": unreadMessage["created_at"]} for unreadMessage in unreadMessages]
        messageIDs = [unreadMessage["message_id"] for unreadMessage in unreadMessages]


        for key, messageID in zip(keys, messageIDs):
            response = tableMessage.update_item(
                Key=key,
                ConditionExpression=Attr("message_id").eq(messageID),
                UpdateExpression="set read_status=:read_status",
                ExpressionAttributeValues={":read_status": True},
                ReturnValues="ALL_NEW"
            )

            updatedMessages.append(response["Attributes"])

        return updatedMessages
    
    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to update message status in hackybara-message: {e.response["Error"]["Message"]}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update message status: {str(e)}")
        
    
@router.delete("/message-delete/{room_id}/{message_id}", response_model=models.message)
async def delete_message(room_id: str, message_id: str, current_user: dict = Depends(get_current_user)):
    currentDate = utils.get_current_date()
    
    try:
        query = tableMessage.query(
            KeyConditionExpression=Key("room_id").eq(room_id),
            FilterExpression=Attr("message_id").eq(message_id)
        )

        message = query.get("Items", [])[0]

        response = tableMessage.update_item(
            Key={"room_id": room_id, "created_at": message["created_at"]},
            UpdateExpression="set content=:content, updated_at=:updated_at",
            ExpressionAttributeValues={":content": "Unsent a message", ":updated_at": currentDate},
            ReturnValues="ALL_NEW"
        )

        return models.message(**response["Attributes"])        
    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to fetch in hackybara-message: {e.response["Error"]["Message"]}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to review: {str(e)}")
    
@router.delete("/message-delete-full/{room_id}/{message_id}", response_model=models.message)
async def delete_full_message(room_id: str, message_id: str, current_user: dict = Depends(get_current_user)):
    
    try:
        query = tableMessage.query(
            KeyConditionExpression=Key("room_id").eq(room_id),
            FilterExpression=Attr("message_id").eq(message_id)
        )

        message = query.get("Items", [])[0]

        tableMessage.delete_item(
            Key={"room_id": room_id, "created_at": message["created_at"]},
        )

        return models.message(**message)        
    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to fetch in hackybara-message: {e.response["Error"]["Message"]}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to review: {str(e)}")


#REVIEW SYSTEM
@router.get("/review/{reviewee_id}/{review_id}", response_model=models.review)
async def get_review(reviewee_id: str, review_id: str, current_user: dict = Depends(get_current_user)):
    try:
        query = tableReview.query(
            KeyConditionExpression=Key("reviewee_id").eq(reviewee_id),
            FilterExpression=Attr("review_id").eq(review_id)
        )

        review = query.get("Items", [])[0]

        images = review.get("images", [])
        if images:
            publicURLs = config.generate_public_urls(images)
            review["images"] = publicURLs

        return review
    
    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to fetch review in hackybara-review: {e.response["Error"]["Message"]}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to review: {str(e)}")
    
@router.get("/product-reviewee-reviewer/{reviewee_id}/{reviewer_id}/{product_id}", response_model=Optional[models.review])
async def get_product_reviewee_reviewer(reviewee_id: str,reviewer_id: str, product_id: str, current_user: dict = Depends(get_current_user)):
    try:
        query = tableReview.query(
            KeyConditionExpression=Key('reviewee_id').eq(reviewee_id),
            FilterExpression=Attr("reviewer_id").eq(reviewer_id) & Attr("product_id").eq(product_id)
        )

        review = query.get("Items", [])

        if not review:
            return None
        
        return review[0]
    
    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to fetch review of reviewer to specific product in hackybara-review: {e.response["Error"]["Message"]}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch reviewer to specific product: {str(e)}")

@router.get("/product-review/{reviewee_id}/{product_id}")
async def get_product_review(reviewee_id: str, product_id: str, current_user: dict = Depends(get_current_user)):
    try:
        query = tableReview.query(
            KeyConditionExpression=Key("reviewee_id").eq(reviewee_id),
            FilterExpression=Attr("product_id").eq(product_id)
        )

        productReview = query.get("Items", [])

        imageURLs = []
        imageCountPerReview = []

        for review in productReview:
            images = review.get("images", []) or []
            imageCountPerReview.append(len(images))
            imageURLs.extend(images)

        publicURLs = config.generate_public_urls(imageURLs) if imageURLs else []

        urlIndex = 0
        for review, imageCount in zip(productReview, imageCountPerReview):
            if imageCount > 0:
                review["images"] = publicURLs[urlIndex: urlIndex + imageCount]
                urlIndex += imageCount

        return productReview
    
    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to fetch product review in hackybara-review: {e.response["Error"]["Message"]}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to review product: {str(e)}")
    
@router.get("/seller-review/{reviewee_id}")
async def get_seller_review(reviewee_id: str, current_user: dict = Depends(get_current_user)):
    try:
        query = tableReview.query(
            KeyConditionExpression=Key("reviewee_id").eq(reviewee_id),
            FilterExpression=Attr("product_id").not_exists()
        )

        sellerReview = query.get("Items", [])

        imageURLs = []
        imageCountPerReview = []

        for review in sellerReview:
            images = review.get("images", []) or []
            imageCountPerReview.append(len(images))
            imageURLs.extend(images)

        publicURLs = config.generate_public_urls(imageURLs) if imageURLs else []

        urlIndex = 0
        for review, imageCount in zip(sellerReview, imageCountPerReview):
            if imageCount > 0:
                review["images"] = publicURLs[urlIndex: urlIndex + imageCount]
                urlIndex += imageCount


        return sellerReview
    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed fetch seller review in hackybara-review: {e.response["Error"]["Message"]}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to review seller: {str(e)}")

@router.post("/review", response_model=models.review)
async def post_review(form: models.raw_review, current_user: dict = Depends(get_current_user)):
    try:
        processedForm = utils.process_review_form(form)

        # Post review in dynamodb hackybara-activity-feed
        tableReview.put_item(
             Item=processedForm.model_dump(exclude_none=True)
        )

        return processedForm
    except ClientError as e:
            raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed Post in hackybara-review: {e.response["Error"]["Message"]}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to post review: {str(e)}")
    
    
@router.put("/review/{reviewee_id}/{review_id}", response_model=models.review)
async def update_review(reviewee_id: str, review_id: str, form: models.update_review, current_user: dict = Depends(get_current_user)):
    try:
        query = tableReview.query(
            KeyConditionExpression=Key("reviewee_id").eq(reviewee_id),
            FilterExpression=Attr("review_id").eq(review_id)
        )
        
        review = query.get("Items", [])[0]

        # Review the submited form
        expressionValues = {}
        expressionName = {}
        updateParts = []

        if form.rating is not None:
            updateParts.append("rating=:rating")
            expressionValues[":rating"] = form.rating
        if form.description is not None:
            updateParts.append("description=:description")
            expressionValues[":description"] = form.description
        if form.images is not None:
            updateParts.append("images=:images")            
            expressionValues[":images"] = form.images
        if form.reported is not None:
            updateParts.append("reported=:reported")            
            expressionValues[":reported"] = form.reported
        if form.voted_as_helpful is not None:
            updateParts.append("#n = list_append(if_not_exists(#n, :empty_list), :val)")
            expressionName["#n"] = "voted_as_helpful"
            expressionValues[":empty_list"] = []
            expressionValues[":val"] = [form.voted_as_helpful]

        updateExpression = "SET " + ", ".join(updateParts) if updateParts else None

        # Update matched review id in dynamodb review
        response = tableReview.update_item(
            Key={"reviewee_id": reviewee_id, "created_at": review["created_at"]},
            UpdateExpression=updateExpression,
            ExpressionAttributeNames=expressionName,
            ExpressionAttributeValues=expressionValues,
            ReturnValues="ALL_NEW"
        )

        return response["Attributes"]
    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to update in hackybara-review: {e.response["Error"]["Message"]}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update review: {str(e)}")

@router.delete("/review-helpful/{reviewee_id}/{review_id}/{user_id}", response_model=models.review)
async def delete_user_helpful_vote(reviewee_id: str, review_id: str, user_id: str):
    try:
        query = tableReview.query(
            KeyConditionExpression=Key("reviewee_id").eq(reviewee_id),
            FilterExpression=Attr("review_id").eq(review_id),
        )
        
        review = query.get("Items", [])[0]
        voters = review.get("voted_as_helpful", [])

        updatedVoters = [voter for voter in voters if voter != user_id]

        response = tableReview.update_item(
            Key={"reviewee_id": reviewee_id, "created_at": review["created_at"]},
            UpdateExpression="SET voted_as_helpful=:voted_as_helpful",
            ExpressionAttributeValues={":voted_as_helpful": updatedVoters},
            ReturnValues="ALL_NEW"
        )

        return response["Attributes"]
    
    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to delete helpful vote review in hackybara-review: {e.response["Error"]["Message"]}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete helpful vote review: {str(e)}")


@router.delete("/review/{reviewee_id}/{review_id}", response_model=models.review)
async def delete_review(reviewee_id: str, review_id: str, current_user: dict = Depends(get_current_user)):
    try:
        query = tableReview.query(
            KeyConditionExpression=Key("reviewee_id").eq(reviewee_id),
            FilterExpression=Attr("review_id").eq(review_id)
        )
    
        review = query.get("Items", [])[0]
        
        tableReview.delete_item(
            Key={"reviewee_id": reviewee_id, "created_at": review["created_at"]},
            ConditionExpression=Attr("review_id").eq(review_id)
        )

        return review
    
    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to delete in hackybara-review: {e.response["Error"]["Message"]}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete review: {str(e)}")
    
@router.delete("/review-image/{reviewee_id}/{review_id}", response_model=models.review)
async def delete_image_review(reviewee_id: str, review_id: str, image: str, current_user: dict = Depends(get_current_user)):
    try:
        query = tableReview.query(
            KeyConditionExpression=Key("reviewee_id").eq(reviewee_id),
            FilterExpression=Attr("review_id").eq(review_id)
        )

        review = query.get("Items", [])[0]

        updatedImages = [reviewImage for reviewImage in review["images"] if reviewImage != image]

        response = tableReview.update_item(
            Key={"reviewee_id": reviewee_id, "created_at": review["created_at"]},
            UpdateExpression="set images=:image",
            ExpressionAttributeValues={":image": updatedImages},
            ReturnValues="ALL_NEW"
        )

        return response.get("Attributes", {})
    
    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to delete image review in hackybara-review: {e.response["Error"]["Message"]}")
    except HTTPException:
        raise 
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete image review: {str(e)}")

@router.delete("/review-images/{reviewee_id}/{review_id}")
async def delete_images_review(reviewee_id: str, review_id: str, images: list[str], current_user: dict = Depends(get_current_user)):
    try:
        query = tableReview.query(
            KeyConditionExpression=Key("reviewee_id").eq(reviewee_id),
            FilterExpression=Attr("review_id").eq(review_id)
        )

        review = query.get("Items", [])[0]

        updatedImages = [reviewImage for reviewImage in review["images"] if reviewImage not in images]

        response = tableReview.update_item(
            Key={"reviewee_id": reviewee_id, "created_at": review["created_at"]},
            UpdateExpression="set images=:image",
            ExpressionAttributeValues={":image": updatedImages},
            ReturnValues="ALL_NEW"
        )

        return response.get("Attributes", {})
    
    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to delete images review in hackybara-review: {e.response["Error"]["Message"]}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete images review: {str(e)}")
    
    
#REPORT SYSTEM
@router.get("/report/{report_id}", response_model=models.report)
async def get_report(report_id: str, current_user: dict = Depends(get_current_user)):
    try:
        query = tableReport.query(
            KeyConditionExpression=Key("report_id").eq(report_id)
        )

        report = query.get("Items", [])[0]

        return report
    
    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to fetch report in hackybara-report: {e.response["Error"]["Message"]}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to review report: {str(e)}")
    
@router.get("/reports")
async def get_all_report(current_user: dict = Depends(get_current_user)):
    try:
        items = []
        response = tableReport.scan()
        items.extend(response.get("Items", []))

        while "LastEvaluatedKey" in response:
            response = tableReport.scan(
                ExclusiveStartKey=response["LastEvaluatedKey"]
            )
            items.extend(response.get("Items", []))

        return items
    
    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to fetch all report in hackybara-report: {e.response["Error"]["Message"]}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to review all report: {str(e)}")
    
@router.post("/report", response_model=models.report)
async def post_report(form: models.raw_report, current_user: dict = Depends(get_current_user)):
    try:
        processedForm = utils.process_report_form(form)

        tableReport.put_item(
            Item=processedForm.model_dump()
        )

        return processedForm
    
    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to post report in hackyabara-report: {e.response["Error"]["Message"]}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to post report: {str(e)}")
    
@router.put("/report/{report_id}", response_model=models.report)
async def update_report(report_id: str, status: str, current_user: dict = Depends(get_current_user)):
    try:
        query = tableReport.query(
            KeyConditionExpression=Key("report_id").eq(report_id)
        )

        report = query.get("Items", [])[0]

        response = tableReport.update_item(
            Key={"report_id": report_id, "created_at": report["created_at"]},
            UpdateExpression="set status=:status",
            ExpressionAttributeValues={":status": status},
            ReturnValues="ALL_NEW"
        )

        return response
    
    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to update report in hackybara-report: {e.response["Error"]["Message"]}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update report: {str(e)}")
    
@router.delete("/report/{report_id}", response_model=models.report)
async def delete_report(report_id: str, current_user: dict = Depends(get_current_user)):
    try:
        query = tableReport.query(
            KeyConditionExpression=Key("report_id").eq(report_id)
        )

        report = query.get("Items", [])[0]

        tableReport.delete_item(
            Key={"report_id": report_id, "created_at": report["created_at"]}
        )

        return report
    
    except ClientError as e:
        raise HTTPException(status_code=e.response["RespnseMetadata"]["HTTPStatusCode"], detail=f"Failed to delete report in hackybara-report: {e.response["Error"]["Message"]}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete report: {str(e)}")

#NOTIFICATION SYSTEM
@router.get("/notification/{user_id}/{notification_id}", response_model=models.notification)
async def get_notification(user_id: str, notification_id: str, current_user: dict = Depends(get_current_user)):
    try:
        query = tableNotification.query(
            KeyConditionExpression=Key("user_id").eq(user_id),
            FilterExpression=Attr("notification_id").eq(notification_id)
        )

        notification = query.get("Items", [])[0]

        return notification
    
    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to fetch notification in hackybara-notification: {e.response["Error"]["Message"]}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch notification: {str(e)}")
    
@router.get("/notifications/{user_id}")
async def get_all_user_notification(user_id: str, current_user: dict = Depends(get_current_user)):
    try:
        query = tableNotification.query(
            KeyConditionExpression=Key("user_id").eq(user_id),
            ScanIndexForward=True
        )

        notifications = query.get("Items", [])

        return notifications
    
    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to fetch all user notification in hackybara-notification: {e.response["Error"]["Message"]}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch all user notification: {str(e)}")

@router.post("/notification", response_model=models.notification)
async def post_notification(form: models.raw_notification, current_user: dict = Depends(get_current_user)):
    try:
        processedForm = utils.process_notification_form(form)

        tableNotification.put_item(
            Item=processedForm.model_dump()
        )

        return processedForm
    
    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to post notification in hackybara-notification: {e.response["Error"]["Message"]}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"failed to post notification: {str(e)}")
    
@router.put("/notification-seen-update/{user_id}")
async def notification_seen_update(user_id: str, current_user: dict = Depends(get_current_user)):
    try:
        items = []

        query = tableNotification.query(
            KeyConditionExpression=Key("user_id").eq(user_id),
            FilterExpression=Attr("seen").eq(False)
        )

        notifications = query.get("Items", [])

        keys = [
            {"user_id": notification["user_id"], "timestamp": notification["timestamp"]} for notification in notifications
        ]

        for key in keys:
            response = tableNotification.update_item(
                Key=key,
                UpdateExpression="set seen=:seen",
                ExpressionAttributeValues={":seen": True},
                ReturnValues="ALL_NEW"
            )

            items.append(response["Attributes"])

        return items
    
    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to update seen notification in hackybara-notification: {e.response["Error"]["Message"]}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update seen notification: {str(e)}")
    
@router.delete("/notification/{user_id}/{notification_id}", response_model=models.notification)
async def delete_notification(user_id: str, notification_id: str, current_user: dict = Depends(get_current_user)):
    try:
        query = tableNotification.query(
            KeyConditionExpression=Key("user_id").eq(user_id),
            FilterExpression=Attr("notification_id").eq(notification_id)
        )

        notification = query.get("Items", [])[0]

        tableNotification.delete_item(
            Key={"user_id": user_id, "timestamp": notification["timestamp"]},
            ConditionExpression=Attr("notification_id").eq(notification_id)
        )

        return notification

    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to delete notification in hackybara-notification: {e.response["Error"]["Message"]}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete notifictaion: {str(e)}")

@router.delete("/notifications/{user_id}")
async def delete_all_read_notification(user_id: str, current_user: dict = Depends(get_current_user)):
    try:
        query = tableNotification.query(
            KeyConditionExpression=Key("user_id").eq(user_id),
            FilterExpression=Attr("seen").eq(True)
        )

        notifications = query.get("Items", [])

        keys = [
            {"user_id": notification["user_id"], "timestamp": notification["timestamp"]} for notification in notifications
        ]

        with tableNotification.batch_writer() as batch:
            for key in keys:
                batch.delete_item(
                    Key=key
                )

        return notifications
    
    except ClientError as e:
        raise HTTPException(status_code=e.response["ProcessMetadata"]["HTTPStatusCode"], detail=f"Failed to delete all read notification in hackybara-notification: {e.response["Error"]["Message"]}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete all read notification: {str(e)}")



    
