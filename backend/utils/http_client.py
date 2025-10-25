import httpx
import asyncio

async def fetch_json(url: str, params: dict = None, timeout: int = 10):
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
    import requests
    try:
        res = requests.get(url, params=params, timeout=timeout)
        res.raise_for_status()
        return res.json()
    except Exception as e:
        print(f"[ERROR] fetch_sync(): {e}")
        return None


