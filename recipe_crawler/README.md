# 만개의 레시피 크롤러

EatSoon 프로젝트를 위한 만개의 레시피 사이트 크롤링 도구입니다.

## 기능

- 만개의 레시피 사이트에서 레시피 데이터 수집
- Firebase Firestore에 자동 저장
- 다양한 카테고리별 레시피 수집
- 중복 방지 및 데이터 정규화

## 설치

1. Python 패키지 설치:
```bash
pip install -r requirements.txt
```

2. Firebase 설정:
   - Firebase 프로젝트에서 서비스 계정 키 생성
   - `firebase-credentials.json` 파일을 프로젝트 루트에 배치
   - 또는 `.env` 파일에 Firebase 설정 정보 입력

## 사용법

### 기본 실행
```bash
python recipe_crawler.py
```

### 특정 카테고리 크롤링
```python
from recipe_crawler import RecipeCrawler

crawler = RecipeCrawler()

# 한식 레시피만 크롤링
crawler.crawl_category(
    "https://www.10000recipe.com/recipe/list.php?cat1=1",
    max_pages=5,
    max_recipes=50
)
```

## 수집되는 데이터

- 레시피 제목
- 재료 목록 (이름, 양, 단위)
- 조리 과정
- 레시피 이미지
- 태그 정보
- 난이도 및 조리시간
- 원본 URL

## 주의사항

- 웹사이트의 robots.txt 및 이용약관을 준수하세요
- 과도한 요청으로 서버에 부하를 주지 않도록 요청 간격을 조절합니다
- 상업적 목적으로 사용 시 해당 웹사이트의 이용약관을 확인하세요

## 라이선스

이 도구는 교육 및 연구 목적으로만 사용되어야 합니다.


