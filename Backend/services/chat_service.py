import uuid
from datetime import datetime, timezone

import google.generativeai as genai
from bson import ObjectId

from config import get_settings
from database import get_database
from models.chat import ChatMessage, ChatResponse, ChatHistoryOut

settings = get_settings()

SYSTEM_PROMPT = """You are Kisan Mitra, an expert agricultural assistant for Indian farmers.
You help farmers with:
- Crop disease identification and treatment advice
- Seasonal crop recommendations based on region and weather
- Market price guidance and when to sell crops
- Fertilizer and irrigation best practices
- Government scheme information (PM-Kisan, Fasal Bima Yojana, etc.)

Always respond in simple, clear language. If the farmer writes in English, Hindi or any regional language,
respond in the same language. Be practical and empathetic — these are rural farmers who need
actionable advice, not technical jargon."""


def _get_model():
    genai.configure(api_key=settings.gemini_api_key)
    return genai.GenerativeModel(model_name="gemini-2.5-flash-lite")


async def send_message(user_message: str, session_id: str | None, user_id: str) -> ChatResponse:
    db = get_database()
    now = datetime.now(timezone.utc)

    # Load or create session
    if session_id:
        session = await db["chat_history"].find_one({"_id": ObjectId(session_id), "user_id": user_id})
    else:
        session = None

    history: list[dict] = session["messages"] if session else []

    # Build prompt with system context + conversation history
    prompt_parts = [SYSTEM_PROMPT, "\n\n"]
    for msg in history[-10:]:  # last 5 exchanges to avoid token overflow
        role_label = "Farmer" if msg["role"] == "user" else "Kisan Mitra"
        prompt_parts.append(f"{role_label}: {msg['content']}\n")
    prompt_parts.append(f"Farmer: {user_message}\nKisan Mitra:")

    full_prompt = "".join(prompt_parts)

    # Call Gemini
    model = _get_model()
    response = model.generate_content(full_prompt)
    reply_text = response.text.strip()

    # Append new messages to history
    history.append({"role": "user", "content": user_message, "timestamp": now})
    history.append({"role": "model", "content": reply_text, "timestamp": now})

    # Save or create session in MongoDB
    if session and session_id:
        await db["chat_history"].update_one(
            {"_id": ObjectId(session_id)},
            {"$set": {"messages": history, "updated_at": now}},
        )
        sid = session_id
    else:
        result = await db["chat_history"].insert_one({
            "user_id": user_id,
            "messages": history,
            "created_at": now,
            "updated_at": now,
        })
        sid = str(result.inserted_id)

    return ChatResponse(reply=reply_text, session_id=sid, timestamp=now)


async def get_history(session_id: str, user_id: str) -> ChatHistoryOut:
    db = get_database()
    session = await db["chat_history"].find_one({"_id": ObjectId(session_id), "user_id": user_id})
    if not session:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Chat session not found")

    messages = [
        ChatMessage(role=m["role"], content=m["content"], timestamp=m.get("timestamp"))
        for m in session["messages"]
    ]
    return ChatHistoryOut(
        session_id=session_id,
        messages=messages,
        created_at=session["created_at"],
        updated_at=session["updated_at"],
    )
