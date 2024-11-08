def calculate_sum_from_file(filename: str = 'w55_ip.txt'):
    """
    w55_ip.txt 파일을 읽어서 첫 번째 컬럼의 합계를 계산
    Args:
        filename (str): 파일명
    """
    total_sum = 0
    try:
        with open(filename, 'r', encoding='utf-8') as file:
            print("\n=== 파일 데이터 및 누적 합계 ===")
            print(f"{'원본 데이터':<30} {'누적 합계':>15}")
            print("-" * 45)
            
            for line in file:
                # 공백을 기준으로 분리하고 첫 번째 값을 가져옴
                columns = line.strip().split()
                if columns:  # 빈 줄이 아닌 경우
                    try:
                        value = float(columns[0])
                        total_sum += value
                        # 원본 라인과 누적 합계 출력
                        print(f"{line.strip():<30} {total_sum:>15,.2f}")
                    except ValueError:
                        print(f"Skip invalid line: {line.strip()}")
                        continue
        
        print("\n=== 최종 결과 ===")
        print(f"총 합계: {total_sum:,.2f}")
        
    except FileNotFoundError:
        print(f"Error: {filename} 파일을 찾을 수 없습니다.")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    calculate_sum_from_file() 