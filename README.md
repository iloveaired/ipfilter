# IP Filter Project

B클래스 IP 주소 필터링 및 분석 도구

## 설치 방법

## 사용 방법

1. IP 필터링 실행:

## 파일 설명

- `test_ppom_bclass.py`: B클래스 IP 필터링 스크립트
- `analyze_output.py`: 필터링 결과 분석 스크립트
- `ppom_bclass.txt`: 입력 파일 (IP 목록)
- `output.txt`: 필터링 결과 파일
- `stats.txt`: 분석 결과 파일


# 현재 디렉토리를 git 저장소로 초기화
git init

# 파일들을 스테이징
git add .

# 첫 번째 커밋
git commit -m "Initial commit"

# GitHub 저장소 연결 (GitHub에서 새 저장소 생성 후)
git remote add origin https://github.com/iloveaired/ipfilter.git

# 푸시
git push -u origin main