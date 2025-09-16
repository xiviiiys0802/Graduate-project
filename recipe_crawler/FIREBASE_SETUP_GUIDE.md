# Firebase 설정 가이드

## 1. Firebase 콘솔 접속
1. https://console.firebase.google.com/ 접속
2. `eatsoon-16f59` 프로젝트 선택

## 2. 서비스 계정 키 생성
1. 좌측 메뉴에서 "프로젝트 설정" (⚙️) 클릭
2. "서비스 계정" 탭 선택
3. "새 비공개 키 생성" 버튼 클릭
4. JSON 파일 다운로드

## 3. 키 파일 설정
1. 다운로드된 JSON 파일을 `firebase-credentials.json`으로 이름 변경
2. `recipe_crawler` 폴더에 저장

## 4. 크롤링 실행
```bash
cd recipe_crawler
python final_recipe_crawler.py
```

## 5. 결과 확인
- `final_recipes.json`: 로컬 저장된 레시피 데이터
- Firebase Firestore: `recipes` 컬렉션에 `final_` 접두사로 저장
