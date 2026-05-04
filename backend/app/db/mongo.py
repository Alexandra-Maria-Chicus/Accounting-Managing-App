import os
from pathlib import Path
from dotenv import load_dotenv
import motor.motor_asyncio

load_dotenv(Path(__file__).parent.parent.parent / ".env")

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
MONGO_DB = os.getenv("MONGO_DB", "completcont_chat")

client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
db = client[MONGO_DB]

chat_collection = db["messages"]