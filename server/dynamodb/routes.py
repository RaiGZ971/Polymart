from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import HTMLResponse
import boto3
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError
from dynamodb import client, utils, models

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
        <input type="text" id="messageText" autocomplete="off" style="width: 80%;" />
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

        function sendMessage(event) {
            event.preventDefault();
            const input = document.getElementById("messageText");
            const text = input.value.trim();
            if (text !== "") {
                ws.send(text);
                input.value = "";
            }
        }

        function appendMessage(msgJSON) {
            const data = typeof msgJSON === 'string' ? JSON.parse(msgJSON) : msgJSON;

            const msgDiv = document.createElement("div");
            msgDiv.className = "message " + (data.sender_id === sender_id ? "you" : "them");
            msgDiv.textContent = data.content;
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
dynamodb = boto3.resource("dynamodb")
tableMessage = dynamodb.Table("hackybara-message") #type:ignore
tableReport = dynamodb.Table("hackybara-report") #type:ignore
tableReview = dynamodb.Table("hackybara-review") #type:ignore
tableNotification = dynamodb.Table("hackybara-notification") #type:ignore

#CHATTING SYSTEM
@router.websocket("/message/{room_id}/{sender_id}/{receiver_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, sender_id: str, receiver_id: str):
    await manager.connect(websocket, room_id)
    try:
        while True:
            data = await websocket.receive_text()
            processedForm = (await manager.send_personal_message(data, room_id, sender_id, receiver_id, websocket)).model_dump()

            # Post message in dynamodb hackybara-message
            try:
                tableMessage.put_item(
                    Item=processedForm
                )
            except ClientError as e:
                raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed Post in hackybara-message: {e.response["Error"]["Message"]}")
            
            await manager.broadcast({
                "sender_id": sender_id,
                "content": data,
                "message_id": processedForm["message_id"]
            }, room_id)

    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)

@router.get("/messages/{sender_id}/{receiver_id}")
async def get_messages(sender_id: str, receiver_id: str):
    room_id = utils.get_room(sender_id, receiver_id)

    try:
        query = tableMessage.query(
            KeyConditionExpression=Key("room_id").eq(room_id),
            FilterExpression=Attr("receiver_id").eq(sender_id) & Attr("read_status").eq(False)
        )

        unreadMessages = query.get("Items", [])

        keys = [{"room_id": room_id, "created_at": unreadMessage["created_at"]} for unreadMessage in unreadMessages]
        messageIDs = [unreadMessage["message_id"] for unreadMessage in unreadMessages]


        for key, messageID in zip(keys, messageIDs):
            tableMessage.update_item(
                Key=key,
                ConditionExpression=Attr("message_id").eq(messageID),
                UpdateExpression="set read_status=:read_status",
                ExpressionAttributeValues={":read_status": True}
            )

        # Read history messages in dynamodb hackybara-message
        query = tableMessage.query(
            KeyConditionExpression=Key("room_id").eq(room_id),
            ScanIndexForward=True
        )

        messages = query.get("Items", [])
        return messages
    
    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to fetch messages in hackybara-message: {e.response["Error"]["Message"]}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to review messages: {str(e)}")
    
@router.get("/message/{room_id}/{message_id}", response_model=models.message)
async def get_message(room_id: str, message_id: str):
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
async def serve_chat_html(sender_id: str, receiver_id: str):
    room_id = utils.get_room(sender_id, receiver_id)
    html_with_room = html.replace("{{room_id}}", room_id)\
                         .replace("{{sender_id}}", sender_id)\
                         .replace("{{receiver_id}}", receiver_id)
    return HTMLResponse(html_with_room)

@router.put("/message-update/{room_id}/{message_id}", response_model=models.message)
async def update_message(room_id: str, message_id: str, content: str):
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
    
@router.delete("/message-delete/{room_id}/{message_id}", response_model=models.message)
async def delete_message(room_id: str, message_id: str):
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
async def delete_full_message(room_id: str, message_id: str):
    
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
async def get_review(reviewee_id: str, review_id: str):
    try:
        query = tableReview.query(
            KeyConditionExpression=Key("reviewee_id").eq(reviewee_id),
            FilterExpression=Attr("review_id").eq(review_id)
        )

        review = query.get("Items", [])[0]

        return review
    
    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to fetch review in hackybara-review: {e.response["Error"]["Message"]}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to review: {str(e)}")

@router.get("/product-review/{reviewee_id}/{product_id}")
async def get_product_review(reviewee_id: str, product_id: str):
    try:
        query = tableReview.query(
            KeyConditionExpression=Key("reviewee_id").eq(reviewee_id),
            FilterExpression=Attr("product_id").eq(product_id)
        )

        productReview = query.get("Items", [])

        return productReview
    
    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to fetch product review in hackybara-review: {e.response["Error"]["Message"]}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to review product: {str(e)}")
    
@router.get("/seller-review/{reviewee_id}")
async def get_seller_review(reviewee_id: str):
    try:
        query = tableReview.query(
            KeyConditionExpression=Key("reviewee_id").eq(reviewee_id),
            FilterExpression=Attr("product_id").not_exists()
        )

        sellerReview = query.get("Items", [])

        return sellerReview
    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed fetch seller review in hackybara-review: {e.response["Error"]["Message"]}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to review seller: {str(e)}")

@router.post("/review", response_model=models.review)
async def post_review(form: models.raw_review):
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
async def update_review(reviewee_id: str, review_id: str, form: models.update_review):
    try:
        query = tableReview.query(
            KeyConditionExpression=Key("reviewee_id").eq(reviewee_id),
            FilterExpression=Attr("review_id").eq(review_id)
        )
        
        review = query.get("Items", [])[0]

        # Review the submited form
        expressionValues = {}
        updateParts = []

        updateParts.append("review_id=:review_id")
        expressionValues[":review_id"] = review_id

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

        updateExpression = "SET " + ", ".join(updateParts) if updateParts else None

        # Update matched review id in dynamodb review
        response = tableReview.update_item(
            Key={"reviewee_id": reviewee_id, "created_at": review["created_at"]},
            UpdateExpression=updateExpression,
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

@router.delete("/review/{reviewee_id}/{review_id}", response_model=models.review)
async def delete_review(reviewee_id: str, review_id: str):
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
    
#REPORT SYSTEM
@router.get("/report/{report_id}", response_model=models.report)
async def get_report(report_id: str):
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
async def get_all_report():
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
async def post_report(form: models.raw_report):
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
async def update_report(report_id: str, status: str):
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
async def delete_report(report_id: str):
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
async def get_notification(user_id: str, notification_id: str):
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
    
@router.get("notifications/{user_id}")
async def get_all_user_notification(user_id: str):
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
async def post_notification(form: models.raw_notification):
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
async def notification_seen_update(user_id: str):
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
async def delete_notification(user_id: str, notification_id: str):
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

@router.delete("notifications/{user_id}")
async def delete_all_read_notification(user_id: str):
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



    