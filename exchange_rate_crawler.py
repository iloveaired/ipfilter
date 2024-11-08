import requests
from bs4 import BeautifulSoup
import pandas as pd
from datetime import datetime
import time
import sys

def get_naver_exchange_rate():
    """네이버 금융 환율 정보 크롤링"""
    try:
        url = "https://finance.naver.com/marketindex/"
        response = requests.get(url)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        rates = {}
        exchange_lists = soup.select("#exchangeList > li")
        
        for item in exchange_lists:
            currency = item.select_one(".h_lst").text.strip()
            rate = item.select_one(".value").text.strip()
            rates[currency] = rate
            
        return {"Naver Finance": rates}
    except Exception as e:
        print(f"Error fetching Naver exchange rate: {str(e)}")
        return {"Naver Finance": "Error"}

def get_kb_exchange_rate():
    """KB 은행 환율 정보 크롤링"""
    try:
        url = "https://ps.kbstar.com/quics?asfilecode=5023&_dc=20240101"
        response = requests.get(url, timeout=10)
        
        rates = {}
        data = response.json()
        
        for item in data['result']['list']:
            currency = item['cur_nm']
            buy_rate = item['buy_fee_rt']
            sell_rate = item['sell_fee_rt']
            rates[currency] = f"매수: {buy_rate} / 매도: {sell_rate}"
            
        return {"KB Bank": rates}
    except requests.exceptions.RequestException as e:
        error_msg = f"KB Bank API 연결 실패: {str(e)}"
        print(error_msg)
        with open('error_log.txt', 'a', encoding='utf-8') as f:
            f.write(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {error_msg}\n")
        sys.exit(1)

def get_hana_exchange_rate():
    """하나은행 환율 정보 크롤링"""
    try:
        url = "https://www.kebhana.com/cms/rate/wpfxd651_07i.do"
        response = requests.get(url, timeout=10)
        
        rates = {}
        data = response.json()
        
        for item in data['리스트']:
            currency = item['통화명']
            basic_rate = item['매매기준율']
            rates[currency] = basic_rate
            
        return {"Hana Bank": rates}
    except requests.exceptions.RequestException as e:
        error_msg = f"하나은행 API 연결 실패: {str(e)}"
        print(error_msg)
        with open('error_log.txt', 'a', encoding='utf-8') as f:
            f.write(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {error_msg}\n")
        sys.exit(1)

def save_exchange_rates(debug=False):
    """환율 정보 수집 및 저장"""
    def log(message):
        if debug:
            print(message)
    
    log("\n=== 환율 정보 수집 시작 ===")
    log(f"수집 시작 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 각 사이트에서 환율 정보 수집
    all_rates = {}
    
    log("\n[네이버 환율 수집 시도]")
    naver_rates = get_naver_exchange_rate()
    if isinstance(naver_rates["Naver Finance"], dict):
        log("✓ 네이버 환율 수집 성공")
        all_rates.update(naver_rates)
    else:
        log("✗ 네이버 환율 수집 실패")
    
    log("\n[KB 환율 수집 시도]")
    kb_rates = get_kb_exchange_rate()
    if isinstance(kb_rates["KB Bank"], dict):
        log("✓ KB 환율 수집 성공")
        all_rates.update(kb_rates)
    else:
        log("✗ KB 환율 수집 실패")
    
    log("\n[하나은행 환율 수집 시도]")
    hana_rates = get_hana_exchange_rate()
    if isinstance(hana_rates["Hana Bank"], dict):
        log("✓ 하나은행 환율 수집 성공")
        all_rates.update(hana_rates)
    else:
        log("✗ 하나은행 환율 수집 실패")
    
    # 결과 저장
    if all_rates:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = f'exchange_rates_{timestamp}.xlsx'
        try:
            df = pd.DataFrame.from_dict(all_rates, orient='index')
            df.to_excel(output_file)
            log(f"\n✓ 환율 정보가 성공적으로 저장되었습니다: {output_file}")
        except Exception as e:
            log(f"\n✗ 파일 저장 중 오류 발생: {str(e)}")
    else:
        log("\n✗ 저장할 환율 데이터가 없습니다")
    
    log("\n=== 환율 정보 수집 완료 ===")
    log(f"수집 종료 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    save_exchange_rates() 