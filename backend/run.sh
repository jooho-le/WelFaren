#!/bin/bash

echo "======================================="
echo " 🚀 Starting Welfare-Finance Backend..."
echo "======================================="

# 가상환경 체크
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# 의존성 설치
pip install -r requirements.txt

# DB 생성 (최초 1회만)
echo "📦 Initializing database..."
python -c "from app.db.models import Base; from app.db.db_conn import engine; Base.metadata.create_all(engine)"

# 서버 실행
echo "🧩 Launching FastAPI (with reload)"
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
