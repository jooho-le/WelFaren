import os
from sqlalchemy import create_engine, MetaData, Table, Column, String, Float, DateTime
from sqlalchemy.orm import sessionmaker
from datetime import datetime

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(bind=engine)
metadata = MetaData()

financial_products = Table(
    "financial_products",
    metadata,
    Column("bank_name", String(50)),
    Column("product_name", String(100)),
    Column("rate", Float),
    Column("update_time", DateTime, default=datetime.now)
)

metadata.create_all(engine)

def save_financial_products(data_list):
    with engine.begin() as conn:
        conn.execute(financial_products.delete())
        conn.execute(financial_products.insert(), data_list)
