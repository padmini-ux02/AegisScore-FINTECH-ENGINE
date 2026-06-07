from fastapi import APIRouter, Header
from typing import Optional
from app.models.schemas import ChatMessage, ChatResponse
from app.services.chatbot_advisor import chatbot_advisor

router = APIRouter(prefix="/chatbot", tags=["AI Chatbot"])

@router.post("", response_model=ChatResponse)
def ask_chatbot(payload: ChatMessage, x_gemini_key: Optional[str] = Header(None)):
    reply, suggestions = chatbot_advisor.get_response(payload.message, x_gemini_key or "")
    return ChatResponse(
        reply=reply,
        suggested_questions=suggestions
    )
