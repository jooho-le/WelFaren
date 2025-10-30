from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.chat_service import (
    ChatContext,
    ChatMessage,
    ChatModelError,
    generate_chat_reply,
)

router = APIRouter()


class ChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(..., description="대화 이력 (최신 순서)")
    context: Optional[ChatContext] = Field(
        None,
        description="사용자 자산/소득 등 컨텍스트 데이터 (선택)",
    )


class ChatResponse(BaseModel):
    reply: str = Field(..., description="Gemini 모델이 생성한 답변")


@router.post("/reply", response_model=ChatResponse)
async def create_chat_reply(payload: ChatRequest) -> ChatResponse:
    try:
        reply = await generate_chat_reply(payload.messages, payload.context)
    except ChatModelError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except RuntimeError as exc:
        # 주로 환경 변수 누락 등 설정 오류
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return ChatResponse(reply=reply)
