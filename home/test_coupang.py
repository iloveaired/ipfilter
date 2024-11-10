import requests
from bs4 import BeautifulSoup
import pandas as pd
from datetime import datetime
import time

def test_coupang_price():
    """
    쿠팡 제품 가격 추적 테스트 함수
    """
    # 테스트할 URL
    url = "https://www.coupang.com/vp/products/8009070810?itemId=22335878956&vendorItemId=89463005056"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Connection': 'keep-alive',
    }
    
    try:
        response = requests.get(url, headers=headers)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 제품명 추출
        product_name = soup.select_one('.prod-buy-header__title')  # 클래스만 사용
        if not product_name:
            product_name = soup.select_one('.title')  # 대체 선택자 시도
        if not product_name:
            product_name = soup.find('h2', {'class': 'prod-buy-header__title'})  # find 메소드로 시도
            
        if product_name:
            product_name = product_name.text.strip()
        
        # 가격 추출
        price = soup.select_one('span.total-price > strong')
        if price:
            price = price.text.strip()
        
        # 현재 시간
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        print("=== 크롤링 결과 ===")
        print(f"제품명: {product_name}")
        print(f"가격: {price}")
        print(f"시간: {current_time}")
        
        # 결과를 딕셔너리로 반환
        return {
            'product_name': product_name,
            'price': price,
            'timestamp': current_time
        }
        
    except Exception as e:
        print(f"에러 발생: {e}")
        return None

# 테스트 실행
if __name__ == "__main__":
    result = test_coupang_price()
    
    if result:
        # 결과를 CSV 파일로 저장
        df = pd.DataFrame([result])
        df.to_csv('coupang_price_test.csv', index=False, encoding='utf-8-sig')
        print("\nCSV 파일 저장 완료: coupang_price_test.csv")