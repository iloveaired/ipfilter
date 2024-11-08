import requests
import hmac
import hashlib
import json
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

class CoupangPartners:
    URL_BASEHEAD = 'https://api-gateway.coupang.com'
    URL_BASEPATH = '/v2/providers/affiliate_open_api/apis/openapi/v1'

    def __init__(self):
        """Initialize with default vendor"""
        self.select_vendor('ppomppu')

    def select_vendor(self, vendor: str):
        """Select vendor and set corresponding keys"""
        if vendor == 'ppomppu':
            self.ACCESS_KEY = 'b590f324-43e8-454b-b69c-a91b6df123a9'
            self.SECRET_KEY = 'eeaa31c8cb4e7cb27837b0e49c89cba048805a5c'
            self.SUB_ID = 'AF9292700'
        else:
            raise ValueError(f"Unknown vendor: {vendor}")

    def deeplink(self, url: str) -> Optional[Dict]:
        """Convert Coupang URL to shortened URL with member tracking code"""
        print(f"[DEBUG] Starting deeplink conversion for URL: {url}")
        
        method = 'POST'
        url_path = '/deeplink'
        data = {
            'subId': self.SUB_ID,
            'coupangUrls': [url]
        }
        
        print(f"[DEBUG] Request data: {json.dumps(data, indent=2)}")
        
        response = self._call(method, url_path, data)
        print(f"[DEBUG] API Response: {json.dumps(response, indent=2) if response else 'None'}")
        
        if not response:
            print("[DEBUG] No response received from API")
            return None
            
        if response.get('httpcode') != 200:
            print(f"[DEBUG] Error response code: {response.get('httpcode')}")
            return None

        return response.get('result')

    def _call(self, method: str, url_path: str, data: Dict = None) -> Optional[Dict]:
        try:
            current_time = datetime.now(timezone.utc)
            datetime_str = current_time.strftime('%y%m%dT%H%M%SZ')
            
            # URL 경로 구성
            full_url_path = f"{self.URL_BASEPATH}{url_path}".strip()
            
            # 메시지 포맷 수정 - 각 부분을 명확하게 구분
            method_part = method.upper()
            path_part = full_url_path
            time_part = datetime_str
            
            # 메시지 조합 (각 부분 사이에 정확한 구분자 사용)
            message = f"{time_part}{method_part}{path_part}"
            
            print(f"[DEBUG] Timestamp: {time_part}")
            print(f"[DEBUG] Method: {method_part}")
            print(f"[DEBUG] Path: {path_part}")
            print(f"[DEBUG] Raw message for signature: {message}")
            
            # 서명 생성
            signature = hmac.new(
                self.SECRET_KEY.encode('utf-8'),
                message.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            
            authorization = (f"CEA algorithm=HmacSHA256, "
                           f"access-key={self.ACCESS_KEY}, "
                           f"signed-date={datetime_str}, "
                           f"signature={signature}").strip()
            
            headers = {
                "Content-Type": "application/json;charset=UTF-8",
                "Authorization": authorization
            }
            
            url = f"{self.URL_BASEHEAD}{full_url_path}"
            
            print(f"[DEBUG] Final URL: {url}")
            print(f"[DEBUG] Authorization: {authorization}")
            
            response = requests.request(
                method=method.upper(),
                url=url,
                headers=headers,
                json=data if data else None,
                verify=False
            )
            
            if response.status_code != 200:
                print(f"[DEBUG] Response Status: {response.status_code}")
                print(f"[DEBUG] Response Body: {response.text}")
                
            return {
                'httpcode': response.status_code,
                'result': response.json() if response.text else None
            }
            
        except Exception as e:
            print(f"[DEBUG] Error: {str(e)}")
            return None
# from ppom_coupang import CoupangPartners
import json
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def test_deeplink(url: str):
    """
    쿠팡 URL을 딥링크로 변환하는 테스트
    """
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    
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

