from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.mongo import chat_collection
from datetime import datetime, timezone
import json

router = APIRouter(tags=["chat"])

active_connections: dict = {}


async def get_chat_history(room: str = "general", limit: int = 50):
    messages = []
    cursor = chat_collection.find(
        {"room": room},
        sort=[("timestamp", -1)],
        limit=limit
    )
    async for msg in cursor:
        msg["_id"] = str(msg["_id"])
        messages.append(msg)
    return list(reversed(messages))

@router.websocket("/ws/chat/{room}/{user_name}")
async def chat_endpoint(websocket: WebSocket, room: str, user_name: str):
    await websocket.accept()

    if room not in active_connections:
        active_connections[room] = []
    active_connections[room].append(websocket)

    try:
        history = await get_chat_history(room)
        await websocket.send_json({"type": "history", "messages": history})

        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)

            doc = {
                "room": room,
                "sender": user_name,
                "message": msg["message"],
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
            await chat_collection.insert_one(doc)
            doc["_id"] = str(doc["_id"])

            await broadcast(room, {"type": "message", **doc})

    except WebSocketDisconnect:
        if websocket in active_connections.get(room, []):
            active_connections[room].remove(websocket)

async def broadcast(room: str, message: dict, exclude=None):
    dead = []
    for ws in active_connections.get(room, []):
        if ws == exclude:
            continue
        try:
            await ws.send_json(message)
        except Exception:
            dead.append(ws)
    for ws in dead:
        active_connections[room].remove(ws)