import hmac
import hashlib
import requests
import json
from time import gmtime, strftime
from dotenv import load_dotenv
import os
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class CoupangReports:
    def __init__(self):
        load_dotenv()
        self.ACCESS_KEY = os.getenv('COUPANG_ACCESS_KEY')
        self.SECRET_KEY = os.getenv('COUPANG_SECRET_KEY')
        self.SUB_ID = os.getenv('SUB_ID')
        self.DOMAIN = "https://api-gateway.coupang.com"
        
    def _generate_hmac(self, method, url):
        path, *query = url.split("?")
        datetime_gmt = strftime('%y%m%d', gmtime()) + 'T' + strftime('%H%M%S', gmtime()) + 'Z'
        message = datetime_gmt + method + path + (query[0] if query else "")
        
        signature = hmac.new(
            bytes(self.SECRET_KEY, "utf-8"),
            message.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()
        
        return f"CEA algorithm=HmacSHA256, access-key={self.ACCESS_KEY}, signed-date={datetime_gmt}, signature={signature}"

    def _make_request(self, endpoint: str, params: dict):
        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        url_path = f"{endpoint}?{query_string}"
        
        authorization = self._generate_hmac("GET", url_path)
        url = f"{self.DOMAIN}{url_path}"
        
        headers = {
            "Authorization": authorization,
            "Content-Type": "application/json"
        }
        
        print("\nRequest Details:")
        print(f"URL: {url}")
        print(f"Method: GET")
        print("Headers:", json.dumps(headers, indent=2))
        
        response = requests.get(url, headers=headers, verify=False)
        return response

    def get_clicks(self, start_date: str, end_date: str, page: int = 0):
        """일별 클릭 수 조회"""
        return self._make_request(
            "/v2/providers/affiliate_open_api/apis/openapi/reports/clicks",
            {"startDate": start_date, "endDate": end_date, "page": page, "subId": self.SUB_ID}
        )

    def get_orders(self, start_date: str, end_date: str, page: int = 0):
        """일별 주문 정보 조회"""
        return self._make_request(
            "/v2/providers/affiliate_open_api/apis/openapi/reports/orders",
            {"startDate": start_date, "endDate": end_date, "page": page, "subId": self.SUB_ID}
        )

    def get_cancels(self, start_date: str, end_date: str, page: int = 0):
        """일별 취소 정보 조회"""
        return self._make_request(
            "/v2/providers/affiliate_open_api/apis/openapi/reports/cancels",
            {"startDate": start_date, "endDate": end_date, "page": page, "subId": self.SUB_ID}
        )

    def get_commission(self, start_date: str, end_date: str, page: int = 0):
        """일별 수익 정보 조회"""
        return self._make_request(
            "/v2/providers/affiliate_open_api/apis/openapi/reports/commission",
            {"startDate": start_date, "endDate": end_date, "page": page, "subId": self.SUB_ID}
        )

    # 광고 관련 리포트
    def get_ad_impression_click(self, start_date: str, end_date: str):
        """광고 노출 및 클릭 정보 조회"""
        return self._make_request(
            "/v2/providers/affiliate_open_api/apis/openapi/reports/ads/impression-click",
            {"startDate": start_date, "endDate": end_date, "subId": self.SUB_ID}
        )

    def get_ad_orders(self, start_date: str, end_date: str):
        """광고 주문 리포트 조회"""
        return self._make_request(
            "/v2/providers/affiliate_open_api/apis/openapi/reports/ads/orders",
            {"startDate": start_date, "endDate": end_date, "subId": self.SUB_ID}
        )

    def get_ad_cancels(self, start_date: str, end_date: str):
        """광고 취소 리포트 조회"""
        return self._make_request(
            "/v2/providers/affiliate_open_api/apis/openapi/reports/ads/cancels",
            {"startDate": start_date, "endDate": end_date, "subId": self.SUB_ID}
        )

    def get_ad_performance(self, start_date: str, end_date: str):
        """광고 성과 리포트 조회"""
        return self._make_request(
            "/v2/providers/affiliate_open_api/apis/openapi/reports/ads/performance",
            {"startDate": start_date, "endDate": end_date, "subId": self.SUB_ID}
        )

    def get_ad_commission(self, start_date: str, end_date: str):
        """광고 수익 리포트 조회"""
        return self._make_request(
            "/v2/providers/affiliate_open_api/apis/openapi/reports/ads/commission",
            {"startDate": start_date, "endDate": end_date, "subId": self.SUB_ID}
        ) 