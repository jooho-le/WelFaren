from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from datetime import datetime
from sqlalchemy.orm import declarative_base

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
