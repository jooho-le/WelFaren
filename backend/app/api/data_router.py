from fastapi import APIRouter
from app.services.fss_service import fetch_fss_deposit_products
from app.db.db_conn import save_financial_products

router = APIRouter()

@router.get("/refresh/fss")
def refresh_fss_products():
    """
    FSS 금융감독원 API를 통해 예적금 상품 데이터 수집 및 DB 갱신
    """
    data = fetch_fss_deposit_products()
    if not data:
        return {"status": "error", "message": "No data fetched from FSS API"}
    
    save_financial_products(data)
    return {"status": "success", "updated_count": len(data)}

@router.get("/products")
def get_products():
    """
    현재 DB에 저장된 금융상품 리스트 조회
    """
    from app.db.db_conn import engine, financial_products
    with engine.connect() as conn:
        rows = conn.execute(financial_products.select()).fetchall()
    return {"count": len(rows), "data": [dict(r._mapping) for r in rows]}
