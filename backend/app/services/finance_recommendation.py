from __future__ import annotations

import re
from typing import Dict, List, Optional

from .finlife_client import FinlifeClient


BANK_GROUP = "020000"
DEFAULT_TERM = 12


class AssetFormData(Dict[str, object]):
    """Thin dict-wrapper for asset form submissions."""


def _compute_interest(principal: float, rate_percent: float, months: int) -> float:
    if principal <= 0 or rate_percent <= 0 or months <= 0:
        return 0.0
    rate = rate_percent / 100
    return round(principal * rate * (months / 12), 2)


def _parse_float(value) -> Optional[float]:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    try:
        return float(str(value).strip())
    except (ValueError, TypeError):
        return None


def _parse_int(value) -> Optional[int]:
    if value is None:
        return None
    if isinstance(value, int):
        return value
    try:
        return int(str(value).strip())
    except (ValueError, TypeError):
        return None


def _parse_currency(value) -> Optional[float]:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    cleaned = re.sub(r"[^0-9.\-]", "", str(value))
    if cleaned in {"", "-", ".", "-.", ".-"}:
        return None
    try:
        return float(cleaned)
    except ValueError:
        return None


def _index_options(option_list: List[Dict]) -> Dict[str, List[Dict]]:
    mapping: Dict[str, List[Dict]] = {}
    for opt in option_list:
        prod = opt.get("fin_prdt_cd")
        if not prod:
            continue
        mapping.setdefault(prod, []).append(opt)
    return mapping


def _analysis_profile(data: AssetFormData) -> Dict[str, float]:
    savings = data.get("savings") or {}
    principal = float(savings.get("principal") or 0)
    annual_rate = float(savings.get("annualRate") or 0) * 100
    months_remaining = int(savings.get("monthsRemaining") or 0)
    penalty_rate = float(
        savings.get("penalty")
        or savings.get("earlyTerminatePenaltyRate")
        or 0
    )
    penalty_amount = round(principal * penalty_rate, 2) if penalty_rate else 0.0

    monthly_income = float(data.get("monthlyIncome") or 0)
    household_size = max(1, int(data.get("householdSize") or 1))

    real_estate = float(data.get("realEstate") or 0)
    deposits = float(data.get("deposits") or 0)
    other_assets = float(data.get("otherAssets") or 0)
    total_assets = max(0.0, real_estate + deposits + other_assets)
    liquid_assets = max(0.0, deposits + other_assets)
    liquidity_ratio = liquid_assets / total_assets if total_assets > 0 else 1.0

    loans = data.get("loans") or []
    total_loans = 0.0
    if isinstance(loans, list):
        for loan in loans:
            if isinstance(loan, dict):
                amount = loan.get("amount")
                parsed = _parse_currency(amount)
                if parsed:
                    total_loans += parsed
    debt_ratio = total_loans / total_assets if total_assets > 0 else 0.0

    income_per_capita = monthly_income / household_size if household_size else monthly_income

    return {
        "principal": principal,
        "annual_rate": annual_rate,
        "months_remaining": months_remaining,
        "penalty_rate": penalty_rate,
        "penalty_amount": penalty_amount,
        "monthly_income": monthly_income,
        "household_size": household_size,
        "income_per_capita": income_per_capita,
        "total_assets": total_assets,
        "liquid_assets": liquid_assets,
        "liquidity_ratio": liquidity_ratio,
        "total_loans": total_loans,
        "debt_ratio": debt_ratio,
    }


def _compute_match_score(
    rate_gain: float,
    term: int,
    target_term: int,
    liquidity_ratio: float,
    debt_ratio: float,
    net_gain: float,
    principal: float,
) -> float:
    rate_score = max(0.0, min(1.0, rate_gain / 2.5)) * 55.0

    effective_term = target_term or term or DEFAULT_TERM
    term_score = 0.0
    if effective_term > 0:
        deviation = abs(term - effective_term)
        term_score = max(0.0, 1.0 - min(deviation / max(effective_term, 6), 1.0)) * 25.0

    liquidity_score = 10.0
    if liquidity_ratio < 0.3:
        liquidity_score = 8.0 if term <= 12 else 4.0
    elif liquidity_ratio < 0.5 and term > 24:
        liquidity_score = 6.0

    debt_penalty = 0.0
    if debt_ratio > 0.5 and term > 12:
        debt_penalty = 10.0
    elif debt_ratio > 0.35 and term > 24:
        debt_penalty = 6.0

    gain_adjust = 0.0
    if principal > 0:
        gain_adjust = max(-10.0, min(10.0, (net_gain / principal) * 100))

    score = rate_score + term_score + liquidity_score + gain_adjust - debt_penalty
    return max(0.0, min(100.0, score))


def _build_reasons(
    rate_gain: float,
    term: int,
    target_term: int,
    interest_gain: float,
    net_gain: float,
    penalty_amount: float,
    liquidity_ratio: float,
    join_way: Optional[str],
) -> List[str]:
    reasons: List[str] = []

    if rate_gain > 0.05:
        reasons.append(f"금리 +{rate_gain:.2f}%p 상승")
    elif rate_gain < -0.05:
        reasons.append(f"금리 -{abs(rate_gain):.2f}%p")
    else:
        reasons.append("금리 동급 유지")

    if interest_gain > 0:
        reasons.append(f"총 이자 +{interest_gain:,.0f}원")
    elif interest_gain < 0:
        reasons.append(f"총 이자 -{abs(interest_gain):,.0f}원")

    if penalty_amount > 0:
        if net_gain >= 0:
            reasons.append(f"패널티 {penalty_amount:,.0f}원 반영 순이익 +{net_gain:,.0f}원")
        else:
            reasons.append(f"패널티 포함 순이익 {net_gain:,.0f}원")
    elif net_gain > 0:
        reasons.append(f"순이익 +{net_gain:,.0f}원 기대")

    if target_term > 0:
        gap = term - target_term
        if abs(gap) <= 3:
            reasons.append("현재 잔여기간과 유사한 만기")
        elif gap < 0:
            reasons.append(f"{abs(gap)}개월 단축")
        else:
            reasons.append(f"{gap}개월 연장")

    if liquidity_ratio < 0.3 and term <= 12:
        reasons.append("유동성 방어(12개월 이하)")
    elif liquidity_ratio >= 0.5 and term >= 24:
        reasons.append("장기 자금 운용")

    if join_way:
        cleaned = join_way.strip()
        if cleaned:
            reasons.append(f"가입경로: {cleaned}")

    return reasons[:5]


async def build_finance_switching(data: AssetFormData, client: Optional[FinlifeClient] = None) -> Dict:
    client = client or FinlifeClient()
    profile = _analysis_profile(data)

    saving_data = await client.fetch_saving_products(BANK_GROUP)
    base_list = saving_data.get("baseList", [])
    option_list = saving_data.get("optionList", [])
    if not base_list or not option_list:
        return {"saving": None}

    principal = profile["principal"]
    annual_rate = profile["annual_rate"]
    months_remaining = profile["months_remaining"]
    penalty_rate = profile["penalty_rate"]
    penalty_amount = profile["penalty_amount"]

    target_term = months_remaining if months_remaining > 0 else DEFAULT_TERM
    current_interest_remaining = _compute_interest(principal, annual_rate, months_remaining) if months_remaining else 0.0
    projected_current_interest = _compute_interest(principal, annual_rate, target_term)

    options_by_product = _index_options(option_list)

    candidates: List[Dict] = []
    for base in base_list:
        prod_code = base.get("fin_prdt_cd")
        if not prod_code:
            continue

        max_limit = _parse_currency(base.get("max_limit"))
        if max_limit and max_limit > 0 and principal > max_limit:
            continue

        options = options_by_product.get(prod_code) or []
        for opt in options:
            term = _parse_int(opt.get("save_trm"))
            if not term or term <= 0:
                continue

            top_rate = _parse_float(opt.get("intr_rate2") or opt.get("intr_rate"))
            base_rate = _parse_float(opt.get("intr_rate"))
            if top_rate is None:
                continue

            interest = _compute_interest(principal, top_rate, term)
            baseline_interest = _compute_interest(principal, annual_rate, term)
            interest_gain = round(interest - baseline_interest, 2)
            net_gain = round(interest_gain - penalty_amount, 2)
            monthly_gain = round(interest_gain / term, 2) if term else 0.0
            rate_gain = round(top_rate - annual_rate, 3)

            match_score = _compute_match_score(
                rate_gain,
                term,
                target_term,
                profile["liquidity_ratio"],
                profile["debt_ratio"],
                net_gain,
                principal,
            )
            reasons = _build_reasons(
                rate_gain,
                term,
                target_term,
                interest_gain,
                net_gain,
                penalty_amount,
                profile["liquidity_ratio"],
                base.get("join_way"),
            )

            candidates.append(
                {
                    "company_name": base.get("kor_co_nm"),
                    "product_name": base.get("fin_prdt_nm"),
                    "fin_prdt_cd": prod_code,
                    "rate": round(top_rate, 3),
                    "base_rate": round(base_rate, 3) if base_rate is not None else None,
                    "interest": round(interest, 2),
                    "interest_gain": interest_gain,
                    "monthly_gain": monthly_gain,
                    "penalty": penalty_amount,
                    "net_gain": net_gain,
                    "rate_gain": rate_gain,
                    "save_term": term,
                    "description": base.get("spcl_cnd") or base.get("etc_note"),
                    "join_method": base.get("join_way"),
                    "join_member": base.get("join_member"),
                    "max_limit": max_limit,
                    "match_score": int(round(match_score)),
                    "reasons": reasons,
                }
            )

    candidates.sort(
        key=lambda x: (
            x["match_score"],
            x["net_gain"],
            x["rate"],
        ),
        reverse=True,
    )

    best = candidates[0] if candidates else None
    alternatives = candidates[1:4] if candidates else []

    if best:
        action = "갈아타기 권장" if best["net_gain"] > 0 else "현재 상품 유지 검토"
        best.update({"action": action})

    summary = {
        "recommendation_count": len(candidates),
        "decision": "추천할 상품이 부족합니다" if not best else ("갈아타기 검토 권장" if best["net_gain"] > 0 else "현재 상품 유지 권장"),
        "net_gain": best["net_gain"] if best else 0.0,
        "penalty_amount": penalty_amount,
        "current_interest_projection": projected_current_interest,
        "current_interest_remaining": current_interest_remaining,
        "confidence": (best["match_score"] / 100) if best else 0.0,
        "target_term": target_term,
    }

    return {
        "saving": {
            "current": {
                "product_name": data.get("savings", {}).get("productName") or "현재 적금",
                "annual_rate": round(annual_rate, 3),
                "months_remaining": months_remaining,
                "principal": principal,
                "expected_interest": round(current_interest_remaining, 2),
                "expected_interest_same_term": round(projected_current_interest, 2),
                "penalty_rate": penalty_rate,
                "penalty_amount": penalty_amount,
                "target_term": target_term,
            },
            "best": best,
            "alternatives": alternatives,
            "summary": summary,
        }
    }
