from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List, Optional
from app.services.welfare_service import WelfareInput, calculate_income_recognition
from app.services.welfare_recommendation import recommend_welfare
from app.services.welfare_provider import USE_MOCK as WELFARE_USE_MOCK
from app.services.welfare_provider import WELFARE_API_BASE, WELFARE_API_LIST_PATH
from app.services.welfare_provider import provider_status

router = APIRouter()

@router.post("/diagnose")
def diagnose_welfare(data: WelfareInput):
    """복지 자격 정밀 진단"""
    result = calculate_income_recognition(data)
    return {"status": "success", "result": result}


class RecommendationRequest(BaseModel):
    """사용자 프로필 기반 추천 요청"""
    region_code: Optional[str] = Field(None, description="지역 코드(시/도/군/구)")
    job_category: Optional[str] = Field(None, description="직업군(예: 학생, 직장인, 자영업, 프리랜서 등)")
    age: Optional[int] = Field(None, description="만 나이")
    preferences: List[str] = Field(default_factory=list, description="선호 카테고리(예: 주거, 돌봄, 의료, 교육, 금융 등)")
    household_size: Optional[int] = Field(None, description="가구원 수(선별 필터용)")
    recognized_income: Optional[float] = Field(
        None,
        description="소득인정액(알고 있다면 전달, 없으면 서버가 추정/미사용)"
    )


@router.post("/recommendations")
def get_recommendations(payload: RecommendationRequest):
    """
    사용자 지역/직업/나이/선호도 기반 복지 서비스 추천

    - 입력: region_code, job_category, age, preferences
    - 출력: 점수순 정렬된 복지 리스트
    """
    items = recommend_welfare(
        region_code=payload.region_code,
        job_category=payload.job_category,
        age=payload.age,
        preferences=payload.preferences,
        household_size=payload.household_size,
        recognized_income=payload.recognized_income,
    )
    status = provider_status()
    return {
        "count": len(items),
        "items": items,
        "meta": {
            "used_mock": bool(WELFARE_USE_MOCK or status.get("last_error")),
            "api_base": WELFARE_API_BASE,
            "list_path": WELFARE_API_LIST_PATH,
            "mock_reason": status.get("last_error"),
            "filters": {
                "region_code": payload.region_code,
                "job_category": payload.job_category,
                "age": payload.age,
                "preferences": payload.preferences,
                "household_size": payload.household_size,
            },
        },
    }
