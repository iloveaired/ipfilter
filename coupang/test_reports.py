from reports import CoupangReports
import json
from datetime import datetime, timedelta

def summarize_commission_report(result):
    """커미션 리포트 결과를 요약하는 함수"""
    summary = {
        "총 수익": 0,
        "주문 건수": 0,
        "취소 건수": 0,
        "평균 수익": 0
    }
    
    if "data" in result:
        data = result["data"]
        summary["총 수익"] = sum(item.get("commission", 0) for item in data)
        summary["주문 건수"] = len(data)
        summary["취소 건수"] = sum(1 for item in data if item.get("status") == "CANCELED")
        
        if summary["주문 건수"] > 0:
            summary["평균 수익"] = summary["총 수익"] / summary["주문 건수"]
    
    return summary

def test_reports():
    # 현재 날짜와 한 달 전 날짜 계산
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)
    
    # YYYYMMDD 형식으로 변환
    start_date = start_date.strftime("%Y%m%d")
    end_date = end_date.strftime("%Y%m%d")
    
    reports = CoupangReports()
    
    try:
        print(f"\n=== 수익 리포트 테스트 ({start_date} ~ {end_date}) ===")
        response = reports.get_commission(start_date, end_date)
        if response.status_code == 200:
            result = response.json()
            print("\nResponse Data:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
            
            # 요약 정보 출력
            summary = summarize_commission_report(result)
            print("\n=== 리포트 요약 ===")
            for key, value in summary.items():
                if "수익" in key:
                    print(f"{key}: {value:,.0f}원")
                else:
                    print(f"{key}: {value:,d}건")
                    
    except Exception as e:
        print(f"\nTest failed: {str(e)}")

if __name__ == "__main__":
    test_reports() 