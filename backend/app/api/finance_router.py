from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, validator

from app.services.finance_recommendation import AssetFormData, build_finance_switching


class LoanDraftSchema(BaseModel):
    lender: Optional[str] = None
    amount: Optional[float] = Field(default=0, ge=0)
    annualRate: Optional[float] = Field(default=0, ge=0)
    remainingMonths: Optional[int] = Field(default=0, ge=0)
    purpose: Optional[str] = None


class SavingsSchema(BaseModel):
    productName: Optional[str] = ''
    principal: float = Field(default=0, ge=0)
    annualRate: float = Field(default=0, ge=0)
    monthsRemaining: int = Field(default=0, ge=0)
    penalty: float = Field(default=0, ge=0)


class AssetRequest(BaseModel):
    monthlyIncome: float = Field(default=0, ge=0)
    householdSize: int = Field(default=1, ge=1)
    realEstate: float = Field(default=0, ge=0)
    deposits: float = Field(default=0, ge=0)
    otherAssets: float = Field(default=0, ge=0)
    savings: SavingsSchema = Field(default_factory=SavingsSchema)
    loans: Optional[list[LoanDraftSchema]] = None

    @validator('monthlyIncome', 'realEstate', 'deposits', 'otherAssets', pre=True)
    def none_to_zero(cls, v):
        if v is None or v == '':
            return 0
        return v


class SavingCurrent(BaseModel):
    product_name: str
    annual_rate: float
    months_remaining: int
    principal: float
    expected_interest: float
    expected_interest_same_term: Optional[float] = None
    penalty_rate: float
    penalty_amount: float
    target_term: Optional[int] = None


class SavingRecommendation(BaseModel):
    product_name: str
    company_name: Optional[str] = None
    fin_prdt_cd: Optional[str] = None
    rate: Optional[float] = None
    base_rate: Optional[float] = None
    interest: Optional[float] = None
    interest_gain: Optional[float] = None
    monthly_gain: Optional[float] = None
    penalty: Optional[float] = None
    net_gain: Optional[float] = None
    rate_gain: Optional[float] = None
    save_term: Optional[int] = None
    description: Optional[str] = None
    join_method: Optional[str] = None
    join_member: Optional[str] = None
    max_limit: Optional[float] = None
    match_score: Optional[int] = Field(default=None, ge=0, le=100)
    reasons: list[str] = Field(default_factory=list)
    action: Optional[str] = None


class SavingSummary(BaseModel):
    recommendation_count: int
    decision: str
    net_gain: float
    penalty_amount: float
    current_interest_projection: float
    current_interest_remaining: float
    confidence: float = Field(default=0, ge=0, le=1)
    target_term: Optional[int] = None


class SavingSwitchResponse(BaseModel):
    current: SavingCurrent
    best: Optional[SavingRecommendation] = None
    alternatives: list[SavingRecommendation] = Field(default_factory=list)
    summary: SavingSummary


class FinanceSwitchResponse(BaseModel):
    saving: Optional[SavingSwitchResponse] = None


router = APIRouter()


@router.post("/recommendations", response_model=FinanceSwitchResponse)
async def recommend_finance_products(payload: AssetRequest) -> FinanceSwitchResponse:
    try:
        data: AssetFormData = payload.dict()
        recos = await build_finance_switching(data)
        return FinanceSwitchResponse(**recos)
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=str(exc)) from exc
