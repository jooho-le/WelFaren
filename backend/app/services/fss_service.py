import os
import requests
import pandas as pd
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

FSS_API_URL = os.getenv(
    "FSS_API_URL",
    "https://finlife.fss.or.kr/finlifeapi/depositProductsSearch.json",
)
API_KEY = os.getenv("FSS_API_KEY", "")
TOP_FIN_GRP_NO = os.getenv("FSS_TOP_FIN_GRP_NO", "020000")  # 기본: 은행권

def fetch_fss_deposit_products():
    """예금/적금 금리 데이터 수집"""
    params = {"auth": API_KEY, "topFinGrpNo": TOP_FIN_GRP_NO, "pageNo": 1}
    res = requests.get(FSS_API_URL, params=params)
    data = res.json()

    if 'result' not in data or 'baseList' not in data['result']:
        return []

    base_list = pd.DataFrame(data['result']['baseList'])
    base_list["update_time"] = datetime.now()
    return base_list.to_dict(orient="records")
