from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from datetime import datetime
from sqlalchemy.orm import declarative_base
from sqlalchemy import ForeignKey, UniqueConstraint

Base = declarative_base()

class FinancialProduct(Base):
    __tablename__ = "financial_products"

    id = Column(Integer, primary_key=True, autoincrement=True)
    bank_name = Column(String(100))
    product_name = Column(String(150))
    rate = Column(Float)
    update_time = Column(DateTime, default=datetime.now)

class WelfareRecord(Base):
    __tablename__ = "welfare_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    household_size = Column(Integer)
    monthly_income = Column(Integer)
    total_assets = Column(Integer)
    recognized_income = Column(Float)
    ratio = Column(Float)
    grade = Column(String(10))
    standard = Column(Integer)
    effective_date = Column(String(20))
    result_json = Column(JSON)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now)

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    region_code = Column(String(10))
    job_category = Column(String(50))
    age = Column(Integer)
    preferences = Column(JSON)
    __table_args__ = (UniqueConstraint('user_id', name='uq_user_profile_user'),)
