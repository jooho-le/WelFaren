Backend (FastAPI)

Endpoints

- POST `/welfare/diagnose`
  - Body: `{ household_size, monthly_income, total_assets }`
  - Returns recognized income and basic eligibility grade.
- POST `/chat/reply`
  - Body: `{ "messages": [{ "role": "user" | "assistant", "content": "<text>" }], "context"?: { ... } }`
  - Returns Gemini-generated 상담 답변을 포함한 JSON (`{ "reply": "<text>" }`).

- POST `/welfare/recommendations`
  - Body: `{ region_code?, job_category?, age?, preferences: string[], household_size?, recognized_income? }`
  - Returns a scored list of welfare programs sorted by relevance.

Local Mock Data

- Default uses mock dataset at `app/data/welfare_samples.json` for stable local testing.
- Set `WELFARE_API_MOCK=false` and provide `WELFARE_API_BASE`, `WELFARE_API_KEY` to enable real API calls.

Environment

- `DATABASE_URL` (optional): defaults to `sqlite:///./backend.db`
- `WELFARE_API_BASE`: external welfare API base URL (when using real API)
- `WELFARE_API_KEY`: API key for welfare API
- `WELFARE_API_MOCK`: if unset, backend auto-uses real API when `WELFARE_API_KEY` exists; otherwise uses mock
- `FSS_API_KEY`: API key for FSS depositProductsSearch
- `FSS_API_URL` (optional): override FSS endpoint
- `FSS_TOP_FIN_GRP_NO` (optional): default `020000` (은행권)
- `GEMINI_API_KEY`: Google AI Studio key for Gemini 상담
- `GEMINI_MODEL_NAME` (optional): Gemini model override (default `gemini-2.0-flash-lite-preview`)

Using 한국사회보장정보원_중앙부처복지서비스

- One‑line setup (recommended):
  - `.env` → `WELFARE_API_KEY=<공공데이터포털_서비스키>`
  - BASE and PATH default to:
    - `WELFARE_API_BASE=https://apis.data.go.kr/B554287/NationalWelfareInformationService`
    - `WELFARE_API_LIST_PATH=/getWlfareInfoList`
  - If you want to force mock: set `WELFARE_API_MOCK=true`

- Notes:
  - Provider maps typical fields: `servId → id`, `servNm → name`, `jurMnofNm → provider`, `servDgst → summary`, `servDtlLink → url`, `lifeArray/trgterIndvdlArray → categories`.
  - If your dataset uses different paths/params, set `WELFARE_API_LIST_PATH` accordingly. On request failure, provider falls back to mock data.

Run

1. `cd backend`
2. `python -m venv venv && source venv/bin/activate`
3. `pip install -r requirements.txt`
4. `uvicorn app.main:app --reload --port 8000`

Integrate From Frontend

- Example (fetch):
  - `POST http://localhost:8000/welfare/recommendations`
  - body example: `{ "region_code": "11", "job_category": "직장인", "age": 29, "preferences": ["주거", "의료"] }`
