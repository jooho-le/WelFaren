import os
from typing import Any, Dict, List, Optional
import json
import requests
from dotenv import load_dotenv

load_dotenv()

# Defaults to 한국사회보장정보원_중앙부처복지서비스(국가복지정보) 목록 API
WELFARE_API_BASE = os.getenv(
    "WELFARE_API_BASE",
    "https://apis.data.go.kr/B554287/NationalWelfareInformationService",
)
WELFARE_API_LIST_PATH = os.getenv(
    "WELFARE_API_LIST_PATH",
    "/getWlfareInfoList",
)
WELFARE_API_KEY = os.getenv("WELFARE_API_KEY", "")

# If WELFARE_API_MOCK is not set, auto-decide: use real API when key exists
_env_mock = os.getenv("WELFARE_API_MOCK")
if _env_mock is None:
    USE_MOCK = not bool(WELFARE_API_KEY)
else:
    USE_MOCK = _env_mock.lower() in ("1", "true", "yes")


def _load_mock_data() -> List[Dict[str, Any]]:
    mock_path = os.path.join(os.path.dirname(__file__), "..", "data", "welfare_samples.json")
    with open(os.path.abspath(mock_path), "r", encoding="utf-8") as f:
        return json.load(f)


def fetch_welfare_programs(
    *,
    region_code: Optional[str],
    job_category: Optional[str],
    age: Optional[int],
) -> List[Dict[str, Any]]:
    """
    외부 복지 API에서 프로그램 목록을 조회하거나, MOCK 데이터를 반환.

    반환 포맷 표준화 예시:
    {
      "id": str,
      "name": str,
      "provider": str,  # 제공기관
      "region_scope": ["11", "26"],  # 적용 지역 코드 (없으면 전국)
      "eligible": {
          "min_age": 0, "max_age": 120,
          "jobs": ["학생", "직장인", ...]  # 빈 리스트면 제한 없음
      },
      "categories": ["주거", "교육", "의료"],
      "summary": str,
      "url": str
    }
    """
    if USE_MOCK or not (WELFARE_API_BASE and WELFARE_API_KEY):
        return _load_mock_data()

    # 실제 API 연동
    # 한국사회보장정보원_중앙부처복지서비스 예시 매핑
    # - 목록 엔드포인트: {BASE}{LIST_PATH}
    # - 공공데이터포털 기본 파라미터: serviceKey, pageNo, numOfRows, (선택) srchKeyWord 등
    params = {
        "serviceKey": WELFARE_API_KEY,
        "pageNo": 1,
        "numOfRows": 200,
        "type": "json",  # 다수 공공데이터 API는 기본 XML이므로 JSON 요청 표시
    }
    # 선택적으로 키워드 필터(직업/지역/연령 키워드를 단순 키워드로 묶음)
    keywords: List[str] = []
    if job_category:
        keywords.append(job_category)
    if region_code:
        keywords.append(region_code)
    if age is not None:
        # 연령대 키워드는 기관 스펙에 따라 lifeArray 등으로 넣어야 할 수 있음. 우선 키워드로만.
        keywords.append(str(age))
    if keywords:
        params["srchKeyWord"] = " ".join(keywords)

    url = f"{WELFARE_API_BASE.rstrip('/')}{WELFARE_API_LIST_PATH}"
    try:
        res = requests.get(url, params=params, timeout=15)
        res.raise_for_status()
        raw = res.json()
    except Exception:
        return _load_mock_data()

    # 응답 파싱: 공공데이터포털 통합 포맷(response/body/items) 또는 data/items 등
    # 중앙부처복지서비스의 대표 필드: servId, servNm, jurMnofNm, servDgst, servDtlLink, lifeArray, trgterIndvdlArray, inqryCnt
    def map_item(r: Dict[str, Any]) -> Dict[str, Any]:
        serv_id = r.get("servId") or r.get("id") or r.get("SERV_ID")
        name = r.get("servNm") or r.get("title") or r.get("name") or "무제"
        provider = r.get("jurMnofNm") or r.get("provider") or r.get("dept") or ""
        url = r.get("servDtlLink") or r.get("url") or ""
        summary = r.get("servDgst") or r.get("summary") or r.get("desc") or ""
        # 카테고리 후보: lifeArray, trgterIndvdlArray (쉼표/슬래시 구분)
        cats_raw = r.get("lifeArray") or r.get("trgterIndvdlArray") or r.get("categories") or ""
        if isinstance(cats_raw, str):
            categories = [c.strip() for c in cats_raw.replace("/", ",").split(",") if c.strip()]
        elif isinstance(cats_raw, list):
            categories = cats_raw
        else:
            categories = []
        return {
            "id": str(serv_id) if serv_id is not None else name,
            "name": name,
            "provider": provider,
            "region_scope": [],  # 중앙부처는 기본 전국으로 간주
            "eligible": {"min_age": 0, "max_age": 120, "jobs": []},
            "categories": categories,
            "summary": summary,
            "url": url,
        }

    items: List[Dict[str, Any]] = []
    # 여러 케이스 대응
    try:
        if isinstance(raw, dict):
            if "response" in raw:
                body = raw.get("response", {}).get("body", {})
                src_items = body.get("items") or body.get("item") or []
                if isinstance(src_items, dict):
                    src_items = [src_items]
                items = [map_item(r) for r in src_items]
            elif "data" in raw:
                src_items = raw.get("data", [])
                items = [map_item(r) for r in src_items]
            elif "items" in raw:
                src_items = raw.get("items", [])
                items = [map_item(r) for r in src_items]
    except Exception:
        # 파싱 실패 시 목데이터로 대체
        return _load_mock_data()

    return items or _load_mock_data()
