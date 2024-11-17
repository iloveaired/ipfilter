from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import pandas as pd
import time
import json

class CoupangCrawler:
    def __init__(self):
        self.options = webdriver.ChromeOptions()
        self.options.add_argument('--headless')
        self.options.add_argument('--no-sandbox')
        self.options.add_argument('--disable-dev-shm-usage')
        self.options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0.0.0')
        
        self.driver = webdriver.Chrome(options=self.options)
        self.wait = WebDriverWait(self.driver, 10)
        
    def __del__(self):
        self.driver.quit()

    def get_product_info(self, url):
        try:
            print(f"[INFO] Crawling URL: {url}")
            self.driver.get(url)
            
            # 기본 정보 추출
            product_info = {
                'title': self._get_text('h2.prod-buy-header__title'),
                'price': self._get_text('span.total-price > strong'),
                'rating': self._get_text('div.rating-star-num', default='평점 없음'),
                'review_count': self._get_text('span.count', default='0'),
                
                # 상품 속성 정보
                'attributes': self._get_attributes(),
                
                # 옵션 정보
                'options': self._get_options(),
                
                # 배송 정보
                'delivery': self._get_delivery_info(),
                
                'url': url
            }
            
            return product_info
            
        except Exception as e:
            print(f"[ERROR] Failed to crawl {url}: {str(e)}")
            return None
            
    def _get_text(self, selector, default=''):
        try:
            element = self.wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, selector))
            )
            return element.text.strip()
        except:
            return default
            
    def _get_attributes(self):
        attributes = {}
        try:
            attr_items = self.driver.find_elements(By.CSS_SELECTOR, 'li.prod-attr-item')
            for item in attr_items:
                if ':' in item.text:
                    key, value = item.text.split(':', 1)
                    attributes[key.strip()] = value.strip()
        except:
            pass
        return attributes
        
    def _get_options(self):
        options = []
        try:
            option_items = self.driver.find_elements(
                By.CSS_SELECTOR, 'div.prod-option-dropdown-item-aside'
            )
            for item in option_items:
                option = {
                    'name': self._get_text('div.prod-option__dropdown-item-title', default=''),
                    'price': self._get_text('span.price-label', default=''),
                }
                options.append(option)
        except:
            pass
        return options
        
    def _get_delivery_info(self):
        delivery = {
            'type': self._get_text('span.shipping-fee-title-txt', default='배송정보 없음'),
            'expected_date': self._get_text('div.prod-txt-onyx', default='')
        }
        return delivery

def main():
    urls = [
        "https://www.coupang.com/vp/products/105193577?itemId=318863816&vendorItemId=3782365703"
    ]
    
    try:
        crawler = CoupangCrawler()
        results = []
        
        for url in urls:
            product_info = crawler.get_product_info(url)
            if product_info:
                results.append(product_info)
                
                # JSON 파일로 저장
                filename = f"coupang_product_{int(time.time())}.json"
                with open(filename, 'w', encoding='utf-8') as f:
                    json.dump(product_info, f, ensure_ascii=False, indent=2)
                print(f"\n[SUCCESS] Product info saved to {filename}")
                
                # 결과 출력
                print("\n크롤링 결과:")
                print(json.dumps(product_info, ensure_ascii=False, indent=2))
                
    except Exception as e:
        print(f"[ERROR] Program failed: {str(e)}")
    
    finally:
        if 'crawler' in locals():
            del crawler

if __name__ == "__main__":
    main()