import hmac
import hashlib
import requests
import json
from time import gmtime, strftime
from dotenv import load_dotenv
import os
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def generateHmac(method, url, secretKey, accessKey):
    path, *query = url.split("?")
    datetimeGMT = strftime('%y%m%d', gmtime()) + 'T' + strftime('%H%M%S', gmtime()) + 'Z'
    message = datetimeGMT + method + path + (query[0] if query else "")

    signature = hmac.new(bytes(secretKey, "utf-8"),
                         message.encode("utf-8"),
                         hashlib.sha256).hexdigest()

    return "CEA algorithm=HmacSHA256, access-key={}, signed-date={}, signature={}".format(accessKey, datetimeGMT, signature)

def test_search_products(keyword: str, limit: int = 5):
    """상품 검색 API 테스트
    Args:
        keyword (str): 검색할 키워드
        limit (int): 조회할 상품 수 (최대 100개, 기본 5개)
    """
    load_dotenv()
    
    ACCESS_KEY = os.getenv('COUPANG_ACCESS_KEY')
    SECRET_KEY = os.getenv('COUPANG_SECRET_KEY')
    DOMAIN = "https://api-gateway.coupang.com"
    URL = f"/v2/providers/affiliate_open_api/apis/openapi/products/search?keyword={keyword}&limit={limit}"
    
    authorization = generateHmac("GET", URL, SECRET_KEY, ACCESS_KEY)
    url = "{}{}".format(DOMAIN, URL)
    
    response = requests.request(
        method="GET",
        url=url,
        headers={
            "Authorization": authorization,
            "Content-Type": "application/json"
        },
        verify=False
    )
    
    print(f"\nResponse Details:")
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))

def test_click_reports(start_date: str, end_date: str, page: int = 0):
    """클릭 리포트 조회 API 테스트
    Args:
        start_date (str): 시작일자 (yyyyMMdd 형식, 20181101 이후)
        end_date (str): 종료일자 (yyyyMMdd 형식, 시작일과 30일 이내)
        page (int, optional): 페이지 번호 (기본값 0, 페이지당 최대 1000개)
    """
    load_dotenv()
    
    ACCESS_KEY = os.getenv('COUPANG_ACCESS_KEY')
    SECRET_KEY = os.getenv('COUPANG_SECRET_KEY')
    SUB_ID = os.getenv('SUB_ID')
    DOMAIN = "https://api-gateway.coupang.com"
    
    # URL 파라미터 구성
    params = f"startDate={start_date}&endDate={end_date}&page={page}&subId={SUB_ID}"
    URL = f"/v2/providers/affiliate_open_api/apis/openapi/reports/commission?{params}"
    
    authorization = generateHmac("GET", URL, SECRET_KEY, ACCESS_KEY)
    url = "{}{}".format(DOMAIN, URL)
    
    # 요청 정보 출력
    print("\nRequest Details:")
    print(f"URL: {url}")
    print(f"Method: GET")
    print("Headers:")
    headers = {
        "Authorization": authorization,
        "Content-Type": "application/json"
    }
    print(json.dumps(headers, indent=2))
    
    response = requests.request(
        method="GET",
        url=url,
        headers=headers,
        verify=False
    )
    
    print(f"\nResponse Details:")
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))

if __name__ == "__main__":
    #test_search_products("food", 5)  # "food" 키워드로 5개 상품 검색
    
    # 클릭 리포트 테스트 (예: 20240301부터 20240307까지)
    test_click_reports("20241101", "20241107", page=0)
   