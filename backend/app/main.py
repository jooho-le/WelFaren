from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import welfare_router, data_router
from app.api import auth_router
from app.api import user_router
from app.api import chat_router
from app.api import finance_router
from app.services.scheduler import start_scheduler
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Welfare-Finance Integration API")

# CORS (프론트엔드 로컬 개발 지원)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 필요한 경우 특정 오리진으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(welfare_router.router, prefix="/welfare", tags=["Welfare"])
app.include_router(data_router.router, prefix="/data", tags=["Data"])
app.include_router(auth_router.router, prefix="/auth", tags=["Auth"])
app.include_router(user_router.router, prefix="/user", tags=["User"])
app.include_router(chat_router.router, prefix="/chat", tags=["Chat"])
app.include_router(finance_router.router, prefix="/finance", tags=["Finance"])

@app.on_event("startup")
async def startup_event():
    start_scheduler()  # FSS 데이터 자동 갱신 스케줄러

@app.get("/")
async def root():
    return {"message": "Welfare-Finance Integration Backend Running"}
