from fastapi import WebSocket
from dynamodb import utils
import json

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}  # room_id -> websockets

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()

        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)

    def disconnect(self, websocket: WebSocket, room_id: str):
        self.active_connections[room_id].remove(websocket)
        if not self.active_connections[room_id]:
            del self.active_connections[room_id]

    async def send_personal_message(self, message: str, room_id: str, sender_id: str, receiver_id: str, websocket: WebSocket):
        await websocket.send_text(message)

        return utils.process_message_form(room_id, message, sender_id, receiver_id)


    async def broadcast(self, message: dict, room_id: str):
        for connection in self.active_connections.get(room_id, []):
            await connection.send_text(json.dumps(message))