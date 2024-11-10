import requests
from bs4 import BeautifulSoup
import pandas as pd
from datetime import datetime
import time
import os

class CoupangCrawler:
    def __init__(self):
        # 현재 실행 경로 저장
        self.current_dir = os.path.dirname(os.path.abspath(__file__))
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Connection': 'keep-alive',
        }
        
        # 결과 저장할 폴더 생성
        self.output_dir = os.path.join(self.current_dir, 'crawling_results')
        os.makedirs(self.output_dir, exist_ok=True)
        
        # 로그 파일 경로
        self.log_file = os.path.join(self.output_dir, 'crawling_log.txt')
        
    def log_message(self, message):
        """로그 메시지를 파일에 저장"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        log_message = f"[{timestamp}] {message}\n"
        
        with open(self.log_file, 'a', encoding='utf-8') as f:
            f.write(log_message)
        
    def crawl_product(self, url):
        """제품 정보를 크롤링하는 메서드"""
        try:
            response = requests.get(url, headers=self.headers)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # HTML 저장 (디버깅용)
            html_file = os.path.join(self.output_dir, 'last_crawled_page.html')
            with open(html_file, 'w', encoding='utf-8') as f:
                f.write(response.text)
            
            # 제품명 추출
            product_name = None
            name_selectors = [
                '.prod-buy-header__title',
                '.title',
                'h2.prod-buy-header__title'
            ]
            
            for selector in name_selectors:
                product_name = soup.select_one(selector)
                if product_name:
                    product_name = product_name.text.strip()
                    break
            
            # 가격 추출
            price = soup.select_one('span.total-price > strong')
            if price:
                price = price.text.strip()
            
            # 현재 시간
            current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            
            result = {
                'product_name': product_name,
                'price': price,
                'timestamp': current_time,
                'url': url
            }
            
            self._print_result(result)
            self._save_to_csv(result)
            
            return result
            
        except Exception as e:
            error_msg = f"크롤링 중 에러 발생: {e}"
            print(error_msg)
            self.log_message(error_msg)
            return None
    
    def track_price(self, url, interval_minutes=60, duration_hours=24):
        """일정 기간 동안 가격을 추적하는 메서드"""
        iterations = (duration_hours * 60) // interval_minutes
        history = []
        
        start_msg = f"가격 추적 시작: {url}"
        print(start_msg)
        self.log_message(start_msg)
        
        for i in range(iterations):
            result = self.crawl_product(url)
            if result:
                history.append(result)
                status_msg = f"진행상황: {i+1}/{iterations}"
                print(f"\n{status_msg}")
                self.log_message(status_msg)
                
            if i < iterations - 1:
                wait_msg = f"{interval_minutes}분 대기 중..."
                print(wait_msg)
                self.log_message(wait_msg)
                time.sleep(interval_minutes * 60)
        
        return history
    
    def _print_result(self, data):
        """결과 출력 메서드"""
        result_msg = (
            "\n=== 크롤링 결과 ===\n"
            f"제품명: {data['product_name']}\n"
            f"가격: {data['price']}\n"
            f"시간: {data['timestamp']}"
        )
        print(result_msg)
        self.log_message(result_msg)
    
    def _save_to_csv(self, data, filename='coupang_price_history.csv'):
        """CSV 저장 메서드"""
        try:
            csv_path = os.path.join(self.output_dir, filename)
            df = pd.DataFrame([data])
            df.to_csv(csv_path, mode='a', header=not os.path.exists(csv_path), 
                     index=False, encoding='utf-8-sig')
            save_msg = f"CSV 파일 저장 완료: {filename}"
            print(save_msg)
            self.log_message(save_msg)
        except Exception as e:
            error_msg = f"CSV 저장 중 에러 발생: {e}"
            print(error_msg)
            self.log_message(error_msg)

def main():
    # 크롤링할 URL
    url = "https://www.coupang.com/vp/products/8009070810?itemId=22335878956&vendorItemId=89463005056"
    
    crawler = CoupangCrawler()
    
    # 단일 크롤링
    # crawler.crawl_product(url)
    
    # 가격 추적 (30분 간격으로 24시간 동안)
    crawler.track_price(url, interval_minutes=30, duration_hours=24)

if __name__ == "__main__":
    main()