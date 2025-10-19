from fastapi import FastAPI
from app.api import welfare_router, data_router
from app.services.scheduler import start_scheduler

app = FastAPI(title="Welfare-Finance Integration API")

app.include_router(welfare_router.router, prefix="/welfare", tags=["Welfare"])
app.include_router(data_router.router, prefix="/data", tags=["Data"])

@app.on_event("startup")
async def startup_event():
    start_scheduler()  # FSS 데이터 자동 갱신 스케줄러

@app.get("/")
async def root():
    return {"message": "Welfare-Finance Integration Backend Running"}
