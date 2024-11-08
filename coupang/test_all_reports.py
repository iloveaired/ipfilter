from reports import CoupangReports
import json
from datetime import datetime, timedelta

def test_all_reports():
    """모든 쿠팡 리포트 API 테스트"""
    reports = CoupangReports()
    start_date = "20241101"  # 2023년 11월 1일
    end_date = "20241107"    # 2023년 11월 7일
    
    test_functions = [
        # 기본 리포트
        {
            "name": "클릭 리포트",
            "func": reports.get_clicks,
            "params": {"start_date": start_date, "end_date": end_date, "page": 0}
        },
        {
            "name": "주문 리포트",
            "func": reports.get_orders,
            "params": {"start_date": start_date, "end_date": end_date, "page": 0}
        },
        {
            "name": "취소 리포트",
            "func": reports.get_cancels,
            "params": {"start_date": start_date, "end_date": end_date, "page": 0}
        },
        {
            "name": "수익 리포트",
            "func": reports.get_commission,
            "params": {"start_date": start_date, "end_date": end_date, "page": 0}
        },
        # 광고 리포트
        {
            "name": "광고 노출/클릭 리포트",
            "func": reports.get_ad_impression_click,
            "params": {"start_date": start_date, "end_date": end_date}
        },
        {
            "name": "광고 주문 리포트",
            "func": reports.get_ad_orders,
            "params": {"start_date": start_date, "end_date": end_date}
        },
        {
            "name": "광고 취소 리포트",
            "func": reports.get_ad_cancels,
            "params": {"start_date": start_date, "end_date": end_date}
        },
        {
            "name": "광고 성과 리포트",
            "func": reports.get_ad_performance,
            "params": {"start_date": start_date, "end_date": end_date}
        },
        {
            "name": "광고 수익 리포트",
            "func": reports.get_ad_commission,
            "params": {"start_date": start_date, "end_date": end_date}
        }
    ]
    
    results = {}
    
    for test in test_functions:
        try:
            print(f"\n=== {test['name']} 테스트 ===")
            response = test['func'](**test['params'])
            
            if response.status_code == 200:
                result = response.json()
                results[test['name']] = {
                    'status': 'success',
                    'data': result
                }
                print("Status: Success")
                print("Response Data:")
                print(json.dumps(result, indent=2, ensure_ascii=False))
            else:
                results[test['name']] = {
                    'status': 'error',
                    'error': f"Status Code: {response.status_code}"
                }
                print(f"Error: Status Code {response.status_code}")
                print(response.text)
                
        except Exception as e:
            results[test['name']] = {
                'status': 'error',
                'error': str(e)
            }
            print(f"Error occurred: {str(e)}")
            
    # 전체 테스트 결과 요약
    print("\n=== 테스트 결과 요약 ===")
    for name, result in results.items():
        status = "성공" if result['status'] == 'success' else f"실패 ({result['error']})"
        print(f"{name}: {status}")

def save_results_to_file(results, filename="report_results.json"):
    """테스트 결과를 파일로 저장"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    test_all_reports() 