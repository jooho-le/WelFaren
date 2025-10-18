from datetime import date
from pydantic import BaseModel
from typing import Dict
import math

# --- 예시 파라미터 (실제는 복지부 고시에서 자동 업데이트) ---
MIDDLE_INCOME_TABLE = {1: 2000000, 2: 3400000, 3: 4400000, 4: 5400000}
ASSET_CONVERSION_RATE = 0.04  # 금융재산 환산율 (예: 4%)
BASIC_PROPERTY_EXEMPTION = 5400000

class WelfareInput(BaseModel):
    household_size: int
    monthly_income: int
    total_assets: int

def calculate_income_recognition(data: WelfareInput) -> Dict:
    """소득인정액 계산"""
    converted_asset_income = max(0, (data.total_assets - BASIC_PROPERTY_EXEMPTION)) * ASSET_CONVERSION_RATE / 12
    recognized_income = data.monthly_income + converted_asset_income
    standard = MIDDLE_INCOME_TABLE.get(data.household_size, 0)
    ratio = recognized_income / standard * 100 if standard else 0

    if ratio <= 80:
        grade = "Green"   # 수급 가능
    elif ratio <= 100:
        grade = "Yellow"  # 경계
    else:
        grade = "Red"     # 초과

    return {
        "recognized_income": round(recognized_income),
        "ratio": round(ratio, 2),
        "grade": grade,
        "standard": standard,
        "effective_date": str(date.today())
    }
