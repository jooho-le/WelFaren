from fastapi import APIRouter
from app.services.welfare_service import WelfareInput, calculate_income_recognition

router = APIRouter()

@router.post("/diagnose")
def diagnose_welfare(data: WelfareInput):
    """복지 자격 정밀 진단"""
    result = calculate_income_recognition(data)
    return {"status": "success", "result": result}
