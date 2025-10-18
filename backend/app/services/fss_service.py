import requests
import pandas as pd
from datetime import datetime

FSS_API_URL = "https://finlife.fss.or.kr/finlifeapi/depositProductsSearch.json"
API_KEY = "YOUR_FSS_API_KEY"

def fetch_fss_deposit_products():
    """예금/적금 금리 데이터 수집"""
    params = {
        "auth": API_KEY,
        "topFinGrpNo": "020000",  # 은행권
        "pageNo": 1
    }
    res = requests.get(FSS_API_URL, params=params)
    data = res.json()

    if 'result' not in data or 'baseList' not in data['result']:
        return []

    base_list = pd.DataFrame(data['result']['baseList'])
    base_list["update_time"] = datetime.now()
    return base_list.to_dict(orient="records")
