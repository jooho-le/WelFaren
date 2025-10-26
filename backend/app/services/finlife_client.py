import os
import time
from functools import lru_cache
from typing import Dict, Iterable, List, Optional, Tuple

import httpx


API_BASE = os.getenv("FSS_FINLIFE_API_BASE", "https://finlife.fss.or.kr/finlifeapi")
API_KEY = os.getenv("FSS_FINLIFE_API_KEY")


class FinlifeAPIError(RuntimeError):
    """Raised when the 금융상품 한눈에 API responds with an error."""


class FinlifeClient:
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None) -> None:
        self.api_key = api_key or API_KEY
        self.base_url = base_url or API_BASE.rstrip("/")
        if not self.api_key:
            raise RuntimeError(
                "FSS_FINLIFE_API_KEY is not set. "
                "Set the environment variable or pass api_key explicitly."
            )

    async def _fetch_page(self, endpoint: str, params: Dict[str, str], page_no: int) -> Dict:
        url = f"{self.base_url}/{endpoint}.json"
        query = {
            "auth": self.api_key,
            "pageNo": page_no,
            **params,
        }
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(url, params=query)
            if resp.status_code != 200:
                raise FinlifeAPIError(
                    f"Finlife API error ({endpoint}): {resp.status_code} {resp.text[:200]}"
                )
            data = resp.json()
            if "result" not in data:
                raise FinlifeAPIError(f"Unexpected response for {endpoint}: {data}")
            return data["result"]

    async def _fetch_all_pages(self, endpoint: str, params: Dict[str, str]) -> Dict[str, List[Dict]]:
        base_list: List[Dict] = []
        option_list: List[Dict] = []
        page_no = 1
        total_count: Optional[int] = None
        while True:
            result = await self._fetch_page(endpoint, params, page_no)
            base_page = result.get("baseList") or []
            option_page = result.get("optionList") or []
            base_list.extend(base_page)
            option_list.extend(option_page)
            total_count = total_count or result.get("totalCount", len(base_page))
            if len(base_list) >= total_count or not base_page:
                break
            page_no += 1
            time.sleep(0.1)  # respectful pacing
        return {"baseList": base_list, "optionList": option_list or []}

    async def fetch_companies(self, top_fin_grp_no: str) -> List[Dict]:
        data = await self._fetch_all_pages(
            "companySearch",
            {"topFinGrpNo": top_fin_grp_no},
        )
        return data["baseList"]

    async def fetch_deposit_products(self, top_fin_grp_no: str) -> Dict[str, List[Dict]]:
        return await self._fetch_all_pages(
            "depositProductsSearch",
            {"topFinGrpNo": top_fin_grp_no},
        )

    async def fetch_saving_products(self, top_fin_grp_no: str) -> Dict[str, List[Dict]]:
        return await self._fetch_all_pages(
            "savingProductsSearch",
            {"topFinGrpNo": top_fin_grp_no},
        )

    async def fetch_credit_loans(self, top_fin_grp_no: str) -> Dict[str, List[Dict]]:
        return await self._fetch_all_pages(
            "creditLoanProductsSearch",
            {"topFinGrpNo": top_fin_grp_no},
        )

    async def fetch_mortgage_loans(self, top_fin_grp_no: str) -> Dict[str, List[Dict]]:
        return await self._fetch_all_pages(
            "mortgageLoanProductsSearch",
            {"topFinGrpNo": top_fin_grp_no},
        )

    async def fetch_rent_loans(self, top_fin_grp_no: str) -> Dict[str, List[Dict]]:
        return await self._fetch_all_pages(
            "rentHouseLoanProductsSearch",
            {"topFinGrpNo": top_fin_grp_no},
        )
