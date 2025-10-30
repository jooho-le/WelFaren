import asyncio
import os
from functools import lru_cache
from typing import Iterable, List, Literal, Optional

import google.generativeai as genai
from google.generativeai import types as genai_types
from fastapi import HTTPException
from pydantic import BaseModel

DEFAULT_MODEL_NAME = "gemini-2.0-flash-lite-preview"


class ChatMessage(BaseModel):
    role: Literal["assistant", "user"]
    content: str


class SavingsSnapshot(BaseModel):
    productName: Optional[str] = None
    principal: Optional[float] = None
    annualRate: Optional[float] = None
    monthsRemaining: Optional[int] = None
    earlyTerminatePenaltyRate: Optional[float] = None


class AssetSnapshot(BaseModel):
    monthlyIncome: Optional[float] = None
    householdSize: Optional[int] = None
    realEstate: Optional[float] = None
    deposits: Optional[float] = None
    otherAssets: Optional[float] = None
    savings: Optional[SavingsSnapshot] = None


class EligibilitySnapshot(BaseModel):
    baseEligible: Optional[bool] = None
    microFinanceEligible: Optional[bool] = None


class IncomeRecognitionSnapshot(BaseModel):
    total: Optional[float] = None
    perCapita: Optional[float] = None


class ChatContext(BaseModel):
    step: Optional[int] = None
    assets: Optional[AssetSnapshot] = None
    incomeRecognition: Optional[IncomeRecognitionSnapshot] = None
    eligibility: Optional[EligibilitySnapshot] = None


class ChatModelError(RuntimeError):
    """Raised when Gemini fails to generate a response."""


SYSTEM_INSTRUCTION = """
당신은 한국의 금융·복지 제도를 전문으로 안내하는 상담사 "WelFAI"입니다.
- 사용자 상황을 파악하여 관련 제도, 지원 절차, 준비 서류 등을 구체적으로 제시합니다.
- 설명은 한국어로 진행하되, 필요한 경우 핵심 수치를 표나 불릿으로 정리합니다.
- 확실하지 않은 정보는 추측하지 않고, 확인이 필요한 경우 "추가 확인 필요"라고 명시합니다.
- 고지 의무: 당신은 정보 제공자이며, 법률·세무·투자 자문이 아니라는 점과 최신 공고 확인을 권장한다는 점을 함께 전달합니다.
- 대화가 모호할 때는 예/아니오 질문이나 선택지를 제안해 정확한 요구를 파악합니다.
"""


@lru_cache(maxsize=1)
def _get_model() -> genai.GenerativeModel:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("Environment variable GEMINI_API_KEY is not set.")

    genai.configure(api_key=api_key)
    model_name = os.getenv("GEMINI_MODEL_NAME", DEFAULT_MODEL_NAME)
    # Temperature tuned for reliable factual responses with some personalization.
    generation_config = genai_types.GenerationConfig(
        candidate_count=1,
        temperature=0.2,
        top_p=0.8,
        top_k=40,
        max_output_tokens=768,
    )

    return genai.GenerativeModel(
        model_name=model_name,
        system_instruction=SYSTEM_INSTRUCTION.strip(),
        generation_config=generation_config,
    )


def _render_context(context: ChatContext) -> Optional[str]:
    if context is None:
        return None

    lines: List[str] = []
    if context.step is not None:
        lines.append(f"- 현재 상담 단계: {context.step}")

    if context.assets:
        assets = context.assets
        lines.append("- 자산 정보 요약:")
        if assets.monthlyIncome is not None:
            lines.append(f"  • 월 소득: {assets.monthlyIncome:,.0f}원")
        if assets.householdSize is not None:
            lines.append(f"  • 가구원 수: {assets.householdSize}")
        if assets.realEstate is not None:
            lines.append(f"  • 부동산 자산: {assets.realEstate:,.0f}원")
        if assets.deposits is not None:
            lines.append(f"  • 예적금: {assets.deposits:,.0f}원")
        if assets.otherAssets is not None:
            lines.append(f"  • 기타 자산: {assets.otherAssets:,.0f}원")
        if assets.savings:
            saving = assets.savings
            title = saving.productName or "미입력"
            lines.append(f"  • 적금 상품: {title}")
            if saving.principal is not None:
                lines.append(f"    - 잔액: {saving.principal:,.0f}원")
            if saving.annualRate is not None:
                lines.append(f"    - 연 이율: {saving.annualRate * 100:.2f}%")
            if saving.monthsRemaining is not None:
                lines.append(f"    - 남은 개월: {saving.monthsRemaining}")
            if saving.earlyTerminatePenaltyRate is not None:
                lines.append(
                    f"    - 중도해지 페널티: {saving.earlyTerminatePenaltyRate * 100:.2f}%"
                )

    if context.incomeRecognition:
        inc = context.incomeRecognition
        lines.append("- 소득 인정액:")
        if inc.total is not None:
            lines.append(f"  • 총액: {inc.total:,.0f}원")
        if inc.perCapita is not None:
            lines.append(f"  • 1인당: {inc.perCapita:,.0f}원")

    if context.eligibility:
        elig = context.eligibility
        lines.append("- 지원 자격 추정:")
        if elig.baseEligible is not None:
            base = "가능성 있음" if elig.baseEligible else "기준 초과"
            lines.append(f"  • 기초생활보장: {base}")
        if elig.microFinanceEligible is not None:
            micro = "가능성 있음" if elig.microFinanceEligible else "가이드 필요"
            lines.append(f"  • 미소금융/서민금융: {micro}")

    if not lines:
        return None

    header = "아래는 사용자가 입력한 재무/복지 관련 컨텍스트입니다."
    return "\n".join([header, *lines])


def _convert_messages(messages: Iterable[ChatMessage]) -> List[dict]:
    converted: List[dict] = []
    for msg in messages:
        role = msg.role.lower()
        if role not in {"user", "assistant"}:
            continue
        converted.append(
            {
                "role": "user" if role == "user" else "model",
                "parts": [msg.content],
            }
        )
    return converted


async def generate_chat_reply(
    messages: Iterable[ChatMessage], context: Optional[ChatContext] = None
) -> str:
    model = _get_model()
    contents = _convert_messages(messages)

    context_text = _render_context(context)
    if context_text:
        contents = [{"role": "user", "parts": [context_text]}] + contents

    if not contents:
        raise HTTPException(status_code=400, detail="At least one message is required.")

    try:
        response = await asyncio.to_thread(model.generate_content, contents)
    except Exception as exc:  # broad: surface meaningful message to caller
        raise ChatModelError("Failed to generate response from Gemini.") from exc

    if not getattr(response, "text", None):
        raise ChatModelError("Empty response received from Gemini.")

    return response.text.strip()
