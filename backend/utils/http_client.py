import httpx
import asyncio

async def fetch_json(url: str, params: dict = None, timeout: int = 10):
    """
    비동기 JSON 요청 유틸
    - httpx.AsyncClient 사용
    - 타임아웃 및 예외 처리 포함
    """
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            res = await client.get(url, params=params)
            res.raise_for_status()
            return res.json()
    except httpx.HTTPStatusError as e:
        print(f"[HTTP ERROR] {e.response.status_code} - {url}")
        return None
    except Exception as e:
        print(f"[ERROR] fetch_json(): {e}")
        return None

def fetch_sync(url: str, params: dict = None, timeout: int = 10):
    """
    동기 버전 (requests 대체용)
    """
    import requests
    try:
        res = requests.get(url, params=params, timeout=timeout)
        res.raise_for_status()
        return res.json()
    except Exception as e:
        print(f"[ERROR] fetch_sync(): {e}")
        return None

# 예시 사용:
# data = await fetch_json("https://api.odcloud.kr/api/some-endpoint", {"serviceKey": KEY})
