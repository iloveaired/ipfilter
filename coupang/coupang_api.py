import os
import time
import hmac
import hashlib
import requests
import json
from urllib.parse import urlencode
from datetime import datetime, timedelta

class CoupangAPI:
    def __init__(self, access_key, secret_key):
        self.ACCESS_KEY = access_key
        self.SECRET_KEY = secret_key
        self.DOMAIN = "https://api-gateway.coupang.com"
    
    def generate_signature(self, url, method, timestamp):
        message = f"{method}\n{url}\n{timestamp}\n{self.ACCESS_KEY}"
        signature = hmac.new(
            self.SECRET_KEY.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        return signature

    def _request(self, path, params=None):
        timestamp = str(int(time.time() * 1000))
        url = f"{path}?{urlencode(params)}" if params else path
        signature = self.generate_signature(url, "GET", timestamp)
        
        headers = {
            "Authorization": f"HMAC-SHA256 {self.ACCESS_KEY}:{signature}",
            "X-Timestamp": timestamp
        }
        
        try:
            response = requests.get(
                f"{self.DOMAIN}{url}",
                headers=headers
            )
            print(f"[DEBUG] API Response Status: {response.status_code}")
            return response.json()
        except Exception as e:
            print(f"[ERROR] API Request Failed: {str(e)}")
            return None

    def search_products(self, keyword, limit=20, sort_type="SALES_RANK"):
        print(f"[DEBUG] Searching products: {keyword}")
        return self._request("/v2/providers/affiliate_open_api/apis/openapi/products/search", {
            "keyword": keyword,
            "limit": limit,
            "sortType": sort_type
        })
    
    def create_deep_link(self, url):
        print(f"[DEBUG] Creating deep link for: {url}")
        return self._request("/v2/providers/affiliate_open_api/apis/openapi/deeplink", {
            "coupangUrl": url
        })
    
    def get_click_stats(self, start_date, end_date, interval="DAY"):
        print(f"[DEBUG] Getting click stats: {start_date} ~ {end_date}")
        return self._request("/v2/providers/affiliate_open_api/apis/openapi/reports/clicks", {
            "startDate": start_date,
            "endDate": end_date,
            "interval": interval
        })
    
    def get_order_stats(self, start_date, end_date, interval="DAY"):
        print(f"[DEBUG] Getting order stats: {start_date} ~ {end_date}")
        return self._request("/v2/providers/affiliate_open_api/apis/openapi/reports/orders", {
            "startDate": start_date,
            "endDate": end_date,
            "interval": interval
        })

def test_api():
    # API 키 설정
    ACCESS_KEY = "YOUR_ACCESS_KEY"
    SECRET_KEY = "YOUR_SECRET_KEY"
    
    # API 인스턴스 생성
    api = CoupangAPI(ACCESS_KEY, SECRET_KEY)
    
    # 테스트 1: 상품 검색
    print("\n=== Test 1: Product Search ===")
    products = api.search_products("노트북", limit=5)
    if products:
        print(json.dumps(products, indent=2, ensure_ascii=False))
    
    # 테스트 2: 딥링크 생성
    print("\n=== Test 2: Deep Link Creation ===")
    deep_link = api.create_deep_link("https://www.coupang.com/vp/products/7576857416")
    if deep_link:
        print(json.dumps(deep_link, indent=2, ensure_ascii=False))
    
    # 테스트 3: 클릭 통계
    print("\n=== Test 3: Click Statistics ===")
    today = datetime.now()
    week_ago = today - timedelta(days=7)
    clicks = api.get_click_stats(
        week_ago.strftime("%Y-%m-%d"),
        today.strftime("%Y-%m-%d")
    )
    if clicks:
        print(json.dumps(clicks, indent=2, ensure_ascii=False))
    
    # 테스트 4: 주문 통계
    print("\n=== Test 4: Order Statistics ===")
    orders = api.get_order_stats(
        week_ago.strftime("%Y-%m-%d"),
        today.strftime("%Y-%m-%d")
    )
    if orders:
        print(json.dumps(orders, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    test_api() 