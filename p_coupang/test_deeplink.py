from ppom_coupang import CoupangPartners
import json
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def test_deeplink(url: str):
    """
    쿠팡 URL을 딥링크로 변환하는 테스트
    """
    try:
        # CoupangPartners 인스턴스 생성
        coupang = CoupangPartners()
        
        print("\n=== Coupang Deeplink Test ===")
        print(f"Original URL: {url}")
        
        # deeplink 호출
        result = coupang.deeplink(url)
        
        # 결과 출력
        print("\n=== Result ===")
        if result:
            print(json.dumps(result, indent=2, ensure_ascii=False))
        else:
            print("Failed to generate deeplink")
            
    except Exception as e:
        print(f"\nError occurred: {str(e)}")

if __name__ == "__main__":
    # 테스트할 URL
    test_url = "https://m.coupang.com/vm/products/2355781?itemId=18775721588&vendorItemId=85907231765&src=1191000&spec=10999999&addtag=400&ctag=2355781&lptag=CFM66652616&itime=20241107104919&pageType=PRODUCT"
    
  
    test_deeplink(test_url) 