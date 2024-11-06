import os
from collections import Counter




def analyze_output():
    input_file = os.path.join(os.getcwd(), 'output.txt')
    stats_file = os.path.join(os.getcwd(), 'stats.txt')
    
    print(f"Analyzing file: {input_file}")
    
    stats = {
        'total_lines': 0,
        'none_count': 0,
        'bclass_count': 0,
        'invalid_format': 0,
        'bclass_networks': Counter()
    }
    
    try:
        with open(input_file, 'r') as f:
            for line in f:
                stats['total_lines'] += 1
                if stats['total_lines'] % 1000 == 0:
                    print(f"Processing... {stats['total_lines']} lines analyzed")
                
                line = line.strip()
                if not line:
                    continue
                
                if 'Invalid line format' in line:
                    stats['invalid_format'] += 1
                    continue
                
                if '-> NONE' in line:
                    stats['none_count'] += 1
                else:
                    # B클래스 네트워크 정보 추출
                    network = line.split('-> ')[1].strip()
                    stats['bclass_count'] += 1
                    stats['bclass_networks'][network] += 1
        
        # 통계 파일 작성
        with open(stats_file, 'w') as f:
            f.write("=== Analysis Results ===\n")
            f.write(f"Total lines analyzed: {stats['total_lines']:,}\n")
            f.write(f"Invalid format lines: {stats['invalid_format']:,}\n")
            f.write(f"NONE results: {stats['none_count']:,}\n")
            f.write(f"B-class networks found: {stats['bclass_count']:,}\n\n")
            
            f.write("=== Top B-class Networks ===\n")
            for network, count in stats['bclass_networks'].most_common(10):
                f.write(f"{network}: {count:,} occurrences\n")
            
            # 백분율 계산
            f.write("\n=== Percentages ===\n")
            total = stats['total_lines']
            f.write(f"NONE results: {(stats['none_count']/total*100):.2f}%\n")
            f.write(f"B-class networks: {(stats['bclass_count']/total*100):.2f}%\n")

        print(f"\nAnalysis completed. Total {stats['total_lines']:,} lines analyzed.")
        print(f"Statistics written to: {stats_file}")

    except FileNotFoundError:
        print(f"Error: {input_file} file not found")
    except Exception as e:
        print(f"Error occurred: {str(e)}")

if __name__ == "__main__":
    analyze_output() 