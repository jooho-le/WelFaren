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

"""Welfare provider for central government services.
Adds debug status so the API can tell the frontend why mock was used.
"""

# If WELFARE_API_MOCK is not set, auto-decide: use real API when key exists
_env_mock = os.getenv("WELFARE_API_MOCK")
if _env_mock is None:
    USE_MOCK = not bool(WELFARE_API_KEY)
else:
    USE_MOCK = _env_mock.lower() in ("1", "true", "yes")

# debug status
LAST_ERROR: Optional[str] = None


def _load_mock_data() -> List[Dict[str, Any]]:
    mock_path = os.path.join(os.path.dirname(__file__), "..", "data", "welfare_samples.json")
    with open(os.path.abspath(mock_path), "r", encoding="utf-8") as f:
        return json.load(f)


def fetch_welfare_programs(
    *,
    region_code: Optional[str],
    job_category: Optional[str],
    age: Optional[int],
    preferences: Optional[List[str]] = None,
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
    global LAST_ERROR
    if USE_MOCK:
        LAST_ERROR = "WELFARE_API_MOCK=true or no key"
        return _load_mock_data()
    if not (WELFARE_API_BASE and WELFARE_API_KEY):
        LAST_ERROR = "Missing API base or key"
        return _load_mock_data()

    # 실제 API 연동
    # 한국사회보장정보원_중앙부처복지서비스 예시 매핑
    # - 목록 엔드포인트: {BASE}{LIST_PATH}
    # - 공공데이터포털 기본 파라미터: serviceKey, pageNo, numOfRows, (선택) srchKeyWord 등
    params = {
        "serviceKey": WELFARE_API_KEY,
        "pageNo": 1,
        "numOfRows": 200,
        # 일부 데이터셋은 resultType 또는 type 파라미터를 사용
        "resultType": "json",
        "type": "json",
    }
    # 선택적으로 키워드 필터(직업/지역/연령 키워드를 단순 키워드로 묶음)
    REGION_NAME = {
        "11": "서울", "26": "부산", "27": "대구", "28": "인천", "29": "광주", "30": "대전",
        "31": "울산", "36": "세종", "41": "경기", "51": "강원", "43": "충북", "44": "충남",
        "45": "전북", "46": "전남", "47": "경북", "48": "경남", "50": "제주",
    }
    keywords: List[str] = []
    if job_category:
        keywords.append(job_category)
    if region_code:
        keywords.append(REGION_NAME.get(region_code, region_code))
    if age is not None:
        # 연령대 키워드는 기관 스펙에 따라 lifeArray 등으로 넣어야 할 수 있음. 우선 키워드로만.
        keywords.append(str(age))
    # preferences도 키워드에 포함
    # 주거/의료/교육/생계 등 한글 키워드로 검색 품질을 보강
    if preferences:
        keywords.extend(preferences)
    if keywords:
        params["srchKeyWord"] = " ".join(keywords)

    url = f"{WELFARE_API_BASE.rstrip('/')}{WELFARE_API_LIST_PATH}"
    try:
        res = requests.get(url, params=params, timeout=15)
        res.raise_for_status()
        try:
            raw = res.json()
        except Exception:
            # JSON 파싱 실패 시 XML로 가정하고 파싱 시도
            try:
                import xmltodict  # type: ignore
                raw = xmltodict.parse(res.text)
            except Exception:
                return _load_mock_data()
    except Exception as e:
        LAST_ERROR = f"request failed: {e}"
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
            # JSON 형식(response/body/items) 또는 XML 파서 결과(dict) 모두 지원
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
            else:
                # XML 파싱 결과로 종종 response > body > items > item 구조
                resp = raw.get("response") or raw.get("Response") or {}
                body = (resp.get("body") if isinstance(resp, dict) else {}) or {}
                src_items = body.get("items") or body.get("item") or []
                if isinstance(src_items, dict):
                    src_items = [src_items]
                if src_items:
                    items = [map_item(r) for r in src_items]
    except Exception as e:
        # 파싱 실패 시 목데이터로 대체
        LAST_ERROR = f"parse failed: {e}"
        return _load_mock_data()

    if not items:
        LAST_ERROR = LAST_ERROR or "no items from API"
        return _load_mock_data()
    LAST_ERROR = None
    return items

def provider_status() -> Dict[str, Any]:
    return {
        "used_mock": USE_MOCK,
        "api_base": WELFARE_API_BASE,
        "list_path": WELFARE_API_LIST_PATH,
        "last_error": LAST_ERROR,
    }
