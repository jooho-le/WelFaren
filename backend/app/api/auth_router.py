from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, Field
import os
from dotenv import load_dotenv
from typing import Optional
from sqlalchemy.orm import Session
from app.db.db_conn import SessionLocal
from app.db.models import User
from app.services.security import hash_password, verify_password, create_access_token, decode_token

load_dotenv()
MIN_PASSWORD_LENGTH = int(os.getenv("MIN_PASSWORD_LENGTH", "4"))  # Demo-friendly default

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class RegisterPayload(BaseModel):
    user_id: str = Field(min_length=1, max_length=64, description="로그인에 사용할 아이디")
    password: str = Field(min_length=MIN_PASSWORD_LENGTH, max_length=256, description="비밀번호 최소 길이 환경변수 MIN_PASSWORD_LENGTH로 조정")


class LoginPayload(BaseModel):
    user_id: str
    password: str


@router.post("/register")
def register(payload: RegisterPayload, db: Session = Depends(get_db)):
    exist = db.query(User).filter(User.email == payload.user_id).first()
    if exist:
        raise HTTPException(status_code=400, detail="Email already registered")
    try:
        u = User(email=payload.user_id, password_hash=hash_password(payload.password))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    db.add(u)
    db.commit()
    db.refresh(u)
    token = create_access_token(str(u.id))
    return {"access_token": token, "token_type": "bearer"}


@router.post("/login")
def login(payload: LoginPayload, db: Session = Depends(get_db)):
    u = db.query(User).filter(User.email == payload.user_id).first()
    if not u or not verify_password(payload.password, u.password_hash):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    token = create_access_token(str(u.id))
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me")
def me(authorization: Optional[str] = Header(default=None), db: Session = Depends(get_db)):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split(" ", 1)[1]
    sub = decode_token(token)
    if not sub:
        raise HTTPException(status_code=401, detail="Invalid token")
    u = db.query(User).get(int(sub))
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": u.id, "user_id": u.email}
