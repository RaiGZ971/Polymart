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
                const response = await fetch(`/dynamodb/message/${sender_id}/${receiver_id}`);
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
tableActivityFeed = dynamodb.Table("hackybara-activity-feed") #type:ignore

#CHATTING SYSTEM
@router.websocket("/message/{room_id}/{sender_id}/{receiver_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, sender_id: str, receiver_id: str):
    await manager.connect(websocket, room_id)
    try:
        while True:
            data = await websocket.receive_text()
            processedForm = (await manager.send_personal_message(data, room_id, sender_id, receiver_id, websocket)).model_dump()

            # Post message in dynamodb 
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

@router.get("/message/{sender_id}/{receiver_id}")
async def get_message(sender_id: str, receiver_id: str):
    room_id = utils.get_room(sender_id, receiver_id)

    # Read history messages in dynamodb hackybara-message
    try:
        query = tableMessage.query(
            KeyConditionExpression=Key("room_id").eq(room_id),
            ScanIndexForward=True
        )

        messages = query.get("Items", [])
        return messages
    
    except ClientError as e:
        raise HTTPException(status_code=e.response["ResponseMetadata"]["HTTPStatusCode"], detail=f"Failed to fetch in hackybara-message: {e.response["Error"]["Message"]}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to review: {str(e)}")
    
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
@router.post("/review", response_model=models.review)
async def post_review(form: models.raw_review):
    try:
        processedForm = utils.process_review_form(form)



        return processedForm
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to review: {str(e)}")
    
@router.put("/review/{review_id}", response_model=models.review)
async def update_review(review_id: str, form: models.update_review):
    try:
        #update matched review id in dynamodb review

        #get updated review
        before_review = {
            "review_id": "string",
            "reviewer_id": "string",
            "reviewee_id": "string",
            "reviewer_type": "string",
            "product_id": "string",
            "order_id": "string",
            "rating": 0,
            "description": "string",
            "images": [
                "string"
            ],
            "created_at": "2025-07-16T17:46:28.307Z",
            "updated_at": "2025-07-16T17:46:28.307Z",
            "reported": False
        }

        updated_review = {
            **before_review,
            **form.model_dump(exclude_unset=True)
        }

        return (models.review(**updated_review))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update review: {str(e)}")



#REPORT SYSTEM

#NOTIFICATION SYSTEM

