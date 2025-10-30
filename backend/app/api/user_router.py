from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from app.db.db_conn import SessionLocal
from app.db.models import User, UserProfile
from app.services.security import decode_token

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(authorization: Optional[str] = Header(default=None), db: Session = Depends(get_db)) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split(" ", 1)[1]
    sub = decode_token(token)
    if not sub:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).get(int(sub))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


class ProfilePayload(BaseModel):
    region_code: Optional[str] = None
    job_category: Optional[str] = None
    age: Optional[int] = None
    preferences: Optional[List[str]] = None


@router.get("/profile")
def get_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    if not p:
        return {"region_code": None, "job_category": None, "age": None, "preferences": []}
    return {
        "region_code": p.region_code,
        "job_category": p.job_category,
        "age": p.age,
        "preferences": p.preferences or [],
    }


@router.post("/profile")
def save_profile(payload: ProfilePayload, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    if not p:
        p = UserProfile(user_id=user.id)
        db.add(p)
    p.region_code = payload.region_code
    p.job_category = payload.job_category
    p.age = payload.age
    p.preferences = payload.preferences or []
    db.commit()
    return {"status": "ok"}
