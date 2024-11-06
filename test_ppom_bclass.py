import os
import ipaddress

def is_valid_ip(ip):
    try:
        ipaddress.ip_address(ip)
        return True
    except ValueError:
        return False

def is_b_class(ip):
    try:
        first_octet = int(ip.split('.')[0])
        return 128 <= first_octet <= 191
    except:
        return False

def filter_b_class_ranges():
    input_file = os.path.join(os.getcwd(), 'ppom_bclass.txt')
    output_file = os.path.join(os.getcwd(), 'output.txt')
    print(f"Processing file: {input_file}")
    
    # 유효한 IP 목록을 저장할 set
    valid_ips = set()
    
    # 먼저 파일에서 유효한 IP 목록을 읽음
    try:
        with open(input_file, 'r') as file:
            for line in file:
                line = line.strip()
                if not line:
                    continue
                
                parts = ' '.join(line.split()).split()
                if len(parts) != 2:
                    continue
                
                ip = parts[1].strip()
                if is_valid_ip(ip):
                    valid_ips.add(ip)
    except Exception as e:
        print(f"Error reading file: {str(e)}")
        return

    # 결과를 파일에 쓰기
    try:
        count = 0
        with open(input_file, 'r') as infile, open(output_file, 'w') as outfile:
            for line in infile:
                count += 1
                if count % 1000 == 0:
                    print(f"Processing... {count} lines completed")
                
                line = line.strip()
                if not line:
                    continue
                
                parts = ' '.join(line.split()).split()
                if len(parts) != 2:
                    outfile.write(f"Warning: Invalid line format: {line}\n")
                    continue
                
                count_val = parts[0].strip()
                ip = parts[1].strip()
                
                result = ""
                if not is_valid_ip(ip):
                    result = f"{ip} -> NONE\n"
                elif ip not in valid_ips:
                    result = f"{ip} -> NONE\n"
                elif is_b_class(ip):
                    network = f"{ip.rsplit('.', 2)[0]}.0.0/16"
                    result = f"{ip} -> {network}\n"
                else:
                    result = f"{ip} -> NONE\n"
                
                outfile.write(result)

        print(f"\nProcessing completed. Total {count} lines processed.")
        print(f"Results written to: {output_file}")

    except FileNotFoundError:
        print(f"Error: {input_file} file not found")
    except Exception as e:
        print(f"Error occurred: {str(e)}")

if __name__ == "__main__":
    filter_b_class_ranges()