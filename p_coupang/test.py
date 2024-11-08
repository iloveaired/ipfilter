import requests
from bs4 import BeautifulSoup
import pandas as pd
from datetime import datetime
from requests.exceptions import RequestException, Timeout

def get_hot_deals():
    print("[DEBUG] 크롤링 시작...")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
    }
    
    url = "https://www.coupang.com/np/categories/393760"
    print(f"[DEBUG] 접속 URL: {url}")
    
    try:
        print("[DEBUG] 페이지 요청 중...")
        response = requests.get(
            url, 
            headers=headers, 
            timeout=2,
            verify=False  # SSL 인증서 검증 비활성화
        )
        print(f"[DEBUG] 응답 상태 코드: {response.status_code}")
        print(f"[DEBUG] 응답 헤더: {response.headers}")
        
    except Timeout:
        print("[ERROR] 요청 시간 초과")
        return None
    except RequestException as e:
        print(f"[ERROR] 요청 실패: {str(e)}")
        return None

if __name__ == "__main__":
    # 크롤링 실행
    hot_deals = get_hot_deals()
    
    if hot_deals is not None:
        print("\n=== 크롤링된 상품 목록 ===")
        print(hot_deals)
