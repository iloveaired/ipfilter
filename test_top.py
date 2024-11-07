import os
from collections import Counter
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

def load_valid_networks():
    valid_networks = set()
    try:
        with open('country_asn222.csv', 'r') as file:
            for line in file:
                line = line.strip()
                if not line:
                    continue
                parts = line.split(',')
                if len(parts) >= 2:
                    network = parts[0].strip('.')
                    valid_networks.add(network)
    except FileNotFoundError:
        print("Error: country_asn222.csv file not found")
    return valid_networks

def print_b_class_ips(min_hits=1000):
    input_file = os.path.join(os.getcwd(), 'ppom_bclass.txt')
    output_dir = os.path.join(os.getcwd(), 'output')
    output_file = os.path.join(output_dir, 'test_top_result.txt')
    
    # output 디렉토리가 없으면 생성
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    valid_networks = load_valid_networks()
    
    stats = {
        'total_lines': 0,
        'matched_count': 0,
        'total_hits': 0,
        'networks': Counter()
    }
    
    try:
        with open(output_file, 'w') as outf:
            outf.write(f"B-Class IPs with {min_hits}+ hits:\n")
            outf.write("-" * 65 + "\n")
            outf.write("Hits    IP              B-Class Network    Status\n")
            outf.write("-" * 65 + "\n")
            
            with open(input_file, 'r') as file:
                for line in file:
                    stats['total_lines'] += 1
                    if stats['total_lines'] % 1000 == 0:
                        print(f"Processing... {stats['total_lines']:,} lines")
                    
                    line = line.strip()
                    if not line:
                        continue
                    
                    parts = ' '.join(line.split()).split()
                    if len(parts) != 2:
                        continue
                    
                    hits = int(parts[0])
                    ip = parts[1].strip()
                    
                    if hits >= min_hits and is_valid_ip(ip) and is_b_class(ip):
                        network = f"{ip.rsplit('.', 2)[0]}"
                        network_str = f"{network}.0.0/16"
                        status = "MATCH" if network in valid_networks else "NONE"
                        
                        if status == "MATCH":
                            stats['matched_count'] += 1
                            stats['networks'][network_str] += hits
                        
                        result_line = f"{hits:6d}  {ip:15s}  {network_str:16s}  {status}\n"
                        outf.write(result_line)
                        stats['total_hits'] += hits

            outf.write("-" * 65 + "\n")
            outf.write(f"\nSummary:\n")
            outf.write(f"Total processed lines: {stats['total_lines']:,}\n")
            outf.write(f"Matched networks: {stats['matched_count']:,}\n")
            outf.write(f"Total hits: {stats['total_hits']:,}\n")
            
            if stats['networks']:
                outf.write("\nTop 10 Matched Networks by Hits:\n")
                outf.write("-" * 40 + "\n")
                for network, hit_count in stats['networks'].most_common(10):
                    outf.write(f"{network}: {hit_count:,} hits\n")

        print(f"\nAnalysis completed. Results written to: {output_file}")

    except FileNotFoundError:
        print(f"Error: {input_file} file not found")
    except Exception as e:
        print(f"Error occurred: {str(e)}")

if __name__ == "__main__":
    print_b_class_ips(100)
    