import streamlit as st
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
        self.wait = WebDriverWait(self.driver, 2)
        
    def __del__(self):
        self.driver.quit()

    def get_product_info(self, url):
        try:
            st.info(f"크롤링 중... URL: {url}")
            self.driver.get(url)
            
            product_info = {
                'title': self._get_text('h1.prod-buy-header__title'),
                'price': self._get_text('span.total-price > strong'),
                'rating': self._get_text('div.rating-star-num', default='평점 없음'),
                'review_count': self._get_text('span.count', default='0'),
                'attributes': self._get_attributes(),
                'options': self._get_options(),
                'delivery': self._get_delivery_info(),
                'url': url
            }
            
            return product_info
            
        except Exception as e:
            st.error(f"크롤링 실패: {str(e)}")
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
    st.title('쿠팡 상품 정보 크롤러')
    
    # URL 입력
    url = st.text_input('쿠팡 상품 URL을 입력하세요:', 
                       placeholder='https://www.coupang.com/vp/products/...')
    
    if st.button('크롤링 시작'):
        if url:
            try:
                with st.spinner('크롤링 중...'):
                    crawler = CoupangCrawler()
                    product_info = crawler.get_product_info(url)
                    
                    if product_info:
                        # 기본 정보 표시
                        st.subheader('기본 정보')
                        col1, col2 = st.columns(2)
                        with col1:
                            st.write('**상품명:**', product_info['title'])
                            st.write('**가격:**', product_info['price'])
                        with col2:
                            st.write('**평점:**', product_info['rating'])
                            st.write('**리뷰 수:**', product_info['review_count'])
                        
                        # 상품 속성 표시
                        st.subheader('상품 속성')
                        if product_info['attributes']:
                            for key, value in product_info['attributes'].items():
                                st.write(f'**{key}:** {value}')
                        else:
                            st.write('속성 정보가 없습니다.')
                            
                        # 옵션 정보 표시
                        st.subheader('옵션 정보')
                        if product_info['options']:
                            df_options = pd.DataFrame(product_info['options'])
                            st.dataframe(df_options)
                        else:
                            st.write('옵션 정보가 없습니다.')
                            
                        # 배송 정보 표시
                        st.subheader('배송 정보')
                        st.write('**배송 유형:**', product_info['delivery']['type'])
                        st.write('**도착 예정:**', product_info['delivery']['expected_date'])
                        
                        # JSON 다운로드 버튼
                        st.download_button(
                            label="JSON 파일 다운로드",
                            data=json.dumps(product_info, ensure_ascii=False, indent=2),
                            file_name=f"coupang_product_{int(time.time())}.json",
                            mime="application/json"
                        )
                        
            except Exception as e:
                st.error(f'오류가 발생했습니다: {str(e)}')
            
            finally:
                if 'crawler' in locals():
                    del crawler
        else:
            st.warning('URL을 입력해주세요.')

if __name__ == '__main__':
    main()