from typing import Any, Dict, List, Optional
from .welfare_provider import fetch_welfare_programs


def _score_program(
    program: Dict[str, Any],
    *,
    region_code: Optional[str],
    job_category: Optional[str],
    age: Optional[int],
    preferences: List[str],
    recognized_income: Optional[float],
) -> float:
    score = 0.0

    # 선호 카테고리 매칭(가중치 높음)
    if preferences:
        cats = {c.lower() for c in (program.get("categories") or [])}
        pref = {p.lower() for p in preferences}
        overlap = cats.intersection(pref)
        if overlap:
            score += 55 + 5 * len(overlap)  # 기본 55점 + 다중 매칭 보너스

    # 지역 적합도 (전국/해당 코드 포함 시 가점)
    region_scope = program.get("region_scope") or []
    if not region_scope or (region_code and region_code in region_scope):
        score += 15

    # 연령 적합도
    eligible = program.get("eligible") or {}
    min_age = eligible.get("min_age", 0)
    max_age = eligible.get("max_age", 200)
    if age is None or (min_age <= age <= max_age):
        score += 15

    # 직업 적합도
    jobs = set((eligible.get("jobs") or []))
    if not jobs or (job_category and job_category in jobs):
        score += 10

    # 소득인정액 적합도(정보가 있을 때만 보수적으로 가점)
    # 실제 규정 연동 전까지는 과도한 패널티/가점을 피함
    if recognized_income is not None:
        score += 5

    return score


def recommend_welfare(
    *,
    region_code: Optional[str],
    job_category: Optional[str],
    age: Optional[int],
    preferences: List[str],
    household_size: Optional[int] = None,
    recognized_income: Optional[float] = None,
) -> List[Dict[str, Any]]:
    programs = fetch_welfare_programs(
        region_code=region_code,
        job_category=job_category,
        age=age,
        preferences=preferences or [],
    )

    # 스코어 계산
    scored = []
    for p in programs:
        s = _score_program(
            p,
            region_code=region_code,
            job_category=job_category,
            age=age,
            preferences=preferences or [],
            recognized_income=recognized_income,
        )
        p_copy = dict(p)
        p_copy["score"] = round(float(s), 2)
        scored.append(p_copy)

    # 점수순 정렬
    scored.sort(key=lambda x: x.get("score", 0), reverse=True)
    return scored
