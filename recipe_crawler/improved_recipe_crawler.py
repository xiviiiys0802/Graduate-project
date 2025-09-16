#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
개선된 레시피 크롤링 스크립트
만개의 레시피에서 100개 레시피를 크롤링하고 Firebase에 업로드
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import random
import re
import os
import sys
from urllib.parse import urljoin, urlparse
import firebase_admin
from firebase_admin import credentials, firestore

# Firebase 초기화
def initialize_firebase():
    """Firebase Admin SDK 초기화"""
    try:
        credential_path = './firebase-credentials.json'
        
        if not os.path.exists(credential_path):
            raise FileNotFoundError("firebase-credentials.json 파일을 찾을 수 없습니다.")
        
        print(f"✅ Firebase 인증서 파일 발견: {credential_path}")
        
        # Firebase Admin SDK 초기화
        cred = credentials.Certificate(credential_path)
        firebase_admin.initialize_app(cred)
        
        # Firestore 클라이언트 생성
        db = firestore.client()
        print("✅ Firebase 초기화 완료")
        return db
        
    except Exception as e:
        print(f"❌ Firebase 초기화 실패: {e}")
        return None

# 크롤링 설정
BASE_URL = "https://www.10000recipe.com"
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
}

# 요리별 검색 키워드 (각각 다른 요리로 취급)
RECIPE_KEYWORDS = [
    # 한식 (우선 가중치 대상)
    "김치찌개", "된장찌개", "고추장찌개", "비빔밥", "불고기", "간장불고기", "고추장불고기", "갈비찜", "양념갈비", "삼겹살", "삼겹살구이",
    "닭볶음탕", "닭갈비", "떡볶이", "간장떡볶이", "순두부찌개", "김치전", "파전", "부침개", "계란말이", "멸치볶음",
    "시래기국", "콩나물국", "미역국", "된장국", "김치볶음밥", "계란볶음밥", "잡채", "육개장", "설렁탕", "갈비탕",
    "삼계탕", "닭볶음", "오징어볶음", "낙지볶음", "고등어조림", "갈치조림", "생선구이", "라면", "냉면", "만두", "교자", "볶음우동", "김치찜",

    # 양식 (샐러드는 2종만, 파스타 다양화)
    "토마토파스타", "크림파스타", "오일파스타", "봉골레파스타", "알리오올리오", "감바스", "까르보나라", "라자냐", "리조또",
    "피자", "마르게리타피자", "페퍼로니피자", "햄버거", "치즈버거", "스테이크", "그라탕", "오믈렛", "스크램블",
    "팬케이크", "와플", "샌드위치", "토스트", "브런치", "시저샐러드", "그린샐러드",

    # 일식 (추가: 카레, 샤브샤브, 밀푀유나베)
    "계란초밥", "라멘", "우동", "소바", "돈카츠", "텐푸라", "야키소바", "오코노미야키", "타코야키", "규동",
    "가츠동", "오야코동", "치킨가라아게", "사시미", "스시", "카레", "샤브샤브", "밀푀유나베",

    # 중식 (겹치는 한식 키워드 제거, 새로운 요리 추가)
    "짜장면", "짬뽕", "탕수육", "깐풍기", "마파두부", "꿔바로우", "춘권", "딤섬", "샤오롱바오", "어향가지",
    "가지튀김", "마라탕", "마라샹궈", "고기딤섬"
]

def get_session():
    """세션 생성"""
    session = requests.Session()
    session.headers.update(HEADERS)
    return session

def search_recipes(session, keyword, max_pages=2):
    """키워드로 레시피 검색"""
    recipe_urls = []
    
    for page in range(1, max_pages + 1):
        try:
            search_url = f"{BASE_URL}/recipe/list.html?q={keyword}&order=reco&page={page}"
            print(f"    🔍 검색 중: {keyword} (페이지 {page})")
            
            response = session.get(search_url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # 레시피 링크 추출
            recipe_links = soup.find_all('a', href=re.compile(r'/recipe/\d+'))
            
            for link in recipe_links:
                href = link.get('href')
                if href and '/recipe/' in href:
                    full_url = urljoin(BASE_URL, href)
                    if full_url not in recipe_urls:
                        recipe_urls.append(full_url)
            
            print(f"    📋 {len(recipe_links)}개 레시피 링크 발견 (총 {len(recipe_urls)}개)")
            
            time.sleep(random.uniform(1, 2))
            
        except Exception as e:
            print(f"    ❌ 검색 실패: {e}")
            continue
    
    return recipe_urls

def clean_ingredient_text(text):
    """재료 텍스트 정리 (구매/조리도구 제거)"""
    # "구매" 제거
    text = re.sub(r'구매$', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    # 조리도구 키워드 제거
    utensil_keywords = [
        '도마','칼','조리용나이프','나이프','스푼','수저','숟가락','젓가락','집게','뒤집개','국자','거품기','볼','그릇',
        '냄비','팬','프라이팬','오븐','전자레인지','믹서기','블렌더','체','망','찜기','압력솥','계량컵','계량스푼','요리도구','조리도구', '뚝배기'
    ]
    lowered = text.lower()
    for k in utensil_keywords:
        if k in lowered:
            return ''
    return text

def extract_servings(soup):
    """몇인분인지 추출"""
    try:
        # 여러 패턴으로 인분 정보 찾기
        patterns = [
            r'(\d+)인분',
            r'(\d+)인',
            r'(\d+)명',
            r'(\d+)인용'
        ]
        
        text_content = soup.get_text()
        
        for pattern in patterns:
            match = re.search(pattern, text_content)
            if match:
                return int(match.group(1))
        
        # 기본값
        return random.randint(1, 4)
        
    except:
        return random.randint(1, 4)

def clean_recipe_steps(steps):
    """레시피 단계 정리 (불필요한 내용 제거, 간결화)"""
    cleaned_steps = []
    remove_prefix_patterns = [r'^[0-9]+\.\s*', r'^[가-힣A-Za-z]*\s*:']
    ban_words = ['이야기', '후기', '소감', '잡담', '광고', '이벤트', '판매', '구독', '좋아요', '댓글', '공유']
    tip_words = ['팁', 'TIP', '참고', '주의', '노하우']

    for step in steps:
        if not step:
            continue
        # 너무 짧은 단계 제거 (5글자 미만)
        if len(step) < 5:
            continue

        # 번호/라벨 제거
        for pat in remove_prefix_patterns:
            step = re.sub(pat, '', step)
        # 괄호/대괄호는 더이상 제거하지 않음 (보조설명 유지)
        # 팁/주석 섹션 잘라내기
        for w in tip_words:
            idx = step.find(w)
            if idx != -1 and idx > 0:
                step = step[:idx]
                break
        # 광고/잡담 포함 단계 제외
        if any(w in step for w in ban_words):
            continue
        # 공백 정리
        step = re.sub(r'\s+', ' ', step).strip()
        # 이미 단계 추출에서 보조설명을 괄호로 처리했으므로 추가 처리 불필요
        # 너무 긴 문장은 자르기 (보조설명이 포함되므로 제한을 늘림)
        if len(step) > 300:
            step = step[:300].rstrip() + '…'
        if step and len(step) >= 5:
            cleaned_steps.append(step)

    return cleaned_steps

def extract_recipe_data(session, url):
    """레시피 데이터 추출"""
    try:
        # 모바일 도메인으로 들어온 경우 데스크톱 도메인으로 정규화
        if url.startswith('https://m.10000recipe.com'):
            url = url.replace('https://m.10000recipe.com', BASE_URL)
        response = session.get(url, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # 레시피 제목
        title_elem = soup.find('h3', class_='view2_summary_info3') or soup.find('h1', class_='view2_summary_info3')
        if not title_elem:
            title_elem = soup.find('h3') or soup.find('h1')
        
        title = title_elem.get_text(strip=True) if title_elem else "제목 없음"
        # 밀키트 레시피 제외
        if '밀키트' in title:
            return None
        
        # 레시피 이미지 (만개의 레시피 이미지만)
        img_elem = soup.find('img', class_='view2_summary_img') or soup.find('img', {'class': re.compile(r'.*summary_img.*')})
        if not img_elem:
            img_elem = soup.find('img', {'src': re.compile(r'.*recipe.*')}) or soup.find('img', {'src': re.compile(r'.*food.*')})
        
        image_url = ""
        if img_elem and img_elem.get('src'):
            img_src = img_elem.get('src')
            if img_src.startswith('//'):
                image_url = 'https:' + img_src
            elif img_src.startswith('/'):
                image_url = BASE_URL + img_src
            elif img_src.startswith('http'):
                image_url = img_src
        
        # 재료 정보
        ingredients = []
        ingredient_sections = soup.find_all('div', class_='ready_ingre3')
        
        for section in ingredient_sections:
            ingredient_items = section.find_all('li')
            for item in ingredient_items:
                ingredient_text = item.get_text(strip=True)
                if ingredient_text and ingredient_text != '재료':
                    # 재료 텍스트 정리
                    cleaned_ingredient = clean_ingredient_text(ingredient_text)
                    # 밀키트 언급 포함 시 제외
                    if cleaned_ingredient and '밀키트' not in cleaned_ingredient:
                        ingredients.append(cleaned_ingredient)
        
        # 조리법
        steps = []
        # 1순위: 데스크톱의 명확한 단계 블록(id=stepDivN)
        step_items = soup.find_all('div', id=re.compile(r'^stepDiv\d+$'))
        # 대체: 넓은 선택자 (모바일/변형 대응)
        if not step_items:
            step_sections = soup.select('div.view_step, section.view_step, div.rd_step, section.rd_step, [class*="step"]')
            step_items = []
            for section in step_sections:
                step_items.extend(section.select('div.view_step_cont, div.rd_step_cont, li.view_step_cont, .step_cont, .step_txt, li'))
        
        for item in step_items:
            # 1) 메인 텍스트와 보조설명을 HTML 구조로 분리
            main_text = ''
            sub_text = ''
            
            # 메인 텍스트: media-body에서 step_add 클래스 제외한 부분
            main_elem = item.find('div', class_='media-body')
            if main_elem:
                # step_add 클래스 요소들 제거하고 메인 텍스트 추출
                main_elem_copy = main_elem.__copy__()
                for tip_elem in main_elem_copy.find_all('p', class_='step_add'):
                    tip_elem.decompose()
                main_text = main_elem_copy.get_text('\n', strip=True)
                # 모든 일반 줄을 메인 텍스트로 사용 (줄바꿈을 공백으로)
                main_lines = [ln.strip() for ln in main_text.split('\n') if ln.strip()]
                main_text = ' '.join(main_lines) if main_lines else ''
            
            # 보조설명: step_add 클래스 요소들
            tip_elements = item.find_all('p', class_='step_add')
            tip_texts = []
            for tip_elem in tip_elements:
                tip_text = tip_elem.get_text(' ', strip=True)
                if tip_text:
                    tip_texts.append(tip_text)
            
            if tip_texts:
                sub_text = ' '.join(tip_texts)
            
            # 2) 불릿(•)으로 시작하는 보조설명도 찾기
            raw_text = item.get_text('\n', strip=True)
            lines = [ln.strip() for ln in raw_text.split('\n') if ln and ln.strip()]
            
            bullet_lines = []
            for line in lines:
                if re.match(r'^[•ㆍ●★☆◆◇▪▫]\s*', line):
                    bullet_text = re.sub(r'^[•ㆍ●★☆◆◇▪▫]+\s*', '', line).strip()
                    if bullet_text:
                        bullet_lines.append(bullet_text)
            
            if bullet_lines:
                bullet_text = ' '.join(bullet_lines)
                sub_text = (sub_text + ' ' + bullet_text).strip() if sub_text else bullet_text
            
            # 3) 작은 회색/보조 span 들 수집하여 보조설명에 추가
            sub_elements = item.find_all('span', class_=re.compile(r'(small|gray|tip|note)', re.I))
            extra_subs = [se.get_text(' ', strip=True) for se in sub_elements if se.get_text(strip=True)]
            if extra_subs:
                sub_text = (sub_text + ' ' + ' '.join(extra_subs)).strip() if sub_text else ' '.join(extra_subs)
            
            # 4) 결합 및 정리
            step_text = main_text.strip()
            if step_text and sub_text:
                step_text = f"{step_text} ({sub_text})"
            elif not step_text and sub_text:
                step_text = sub_text
            elif not step_text:
                # 메인 텍스트가 없으면 전체 텍스트 사용
                step_text = ' '.join([ln.strip() for ln in lines if ln.strip()])
            
            step_text = re.sub(r'\s+', ' ', step_text).strip()
            
            if step_text and '밀키트' not in step_text:
                steps.append(step_text)
        
        # 조리법 정리
        steps = clean_recipe_steps(steps)
        
        # 태그
        tags = []
        tag_elements = soup.find_all('a', href=re.compile(r'/recipe/list\.html\?q='))
        for tag_elem in tag_elements:
            tag_text = tag_elem.get_text(strip=True)
            if tag_text and len(tag_text) > 1:
                tags.append(tag_text)
        
        # 인분 수 추출
        servings = extract_servings(soup)
        
        # 기본 정보
        recipe_id = f"crawled_{int(time.time())}_{random.randint(1000, 9999)}"
        
        # 요리 카테고리 판단
        category = "한식"
        if any(keyword in title for keyword in ["파스타", "스파게티", "피자", "스테이크", "샐러드", "그라탕", "오믈렛"]):
            category = "양식"
        elif any(keyword in title for keyword in ["초밥", "라멘", "우동", "돈카츠", "텐푸라", "규동", "가츠동"]):
            category = "일식"
        elif any(keyword in title for keyword in ["짜장면", "짬뽕", "탕수육", "깐풍기", "마파두부", "춘권", "만두"]):
            category = "중식"
        
        recipe_data = {
            "id": recipe_id,
            "name": title,
            "ingredients": ingredients,
            "steps": steps,
            "tags": tags[:5],  # 최대 5개 태그
            "imageUrl": image_url,
            "sourceUrl": url,
            "category": category,
            "servings": servings,
            "cookingTime": random.randint(15, 120),  # 15-120분
            "difficulty": random.choice(["쉬움", "보통", "어려움"]),
            "createdAt": firestore.SERVER_TIMESTAMP
        }
        
        return recipe_data
        
    except Exception as e:
        print(f"    ❌ 레시피 추출 실패: {e}")
        return None

def score_recipe(recipe_data):
    """레시피 점수 계산 (간단/명료 중심)"""
    score = 0

    name = recipe_data.get('name', '')
    ingredients = recipe_data.get('ingredients', [])
    steps = recipe_data.get('steps', [])

    # 간단/초간단/원팬/자취 등 키워드 보너스
    keyword_bonus = 0
    for kw, pts in [("초간단", 25), ("간단", 15), ("원팬", 10), ("자취", 10), ("한그릇", 8), ("빠른", 8), ("쉽게", 8)]:
        if kw in name:
            keyword_bonus += pts
    score += min(keyword_bonus, 40)

    # 백종원/백선생은 소폭 가산점만
    if ('백종원' in name) or ('백선생' in name):
        score += 10

    # 재료 수가 적을수록 높은 점수 (최대 50점)
    ingredient_count = len(ingredients)
    if ingredient_count <= 4:
        score += 50
    elif ingredient_count <= 6:
        score += 40
    elif ingredient_count <= 9:
        score += 25
    elif ingredient_count <= 12:
        score += 15
    else:
        score += 5

    # 조리법 단계가 적을수록 높은 점수 (최대 40점)
    step_count = len(steps)
    if step_count <= 3:
        score += 40
    elif step_count <= 5:
        score += 30
    elif step_count <= 8:
        score += 15

    # 단계 평균 길이가 짧을수록 가산점 (최대 20점)
    if step_count > 0:
        avg_len = sum(len(s) for s in steps) / step_count
        if avg_len <= 60:
            score += 20
        elif avg_len <= 100:
            score += 12
        elif avg_len <= 140:
            score += 6

    # 지나치게 긴 단계가 있으면 감점
    if any(len(s) > 260 for s in steps):
        score -= 10

    # 기본 점수
    score += 10

    return score

def crawl_recipes():
    """메인 크롤링 함수"""
    print("🚀 레시피 크롤링 시작")
    
    # Firebase 초기화
    db = initialize_firebase()
    if not db:
        return
    
    session = get_session()
    all_recipes = []
    selected_recipes = {}  # 요리별로 최고 점수 레시피만 저장
    
    print(f"\n📝 {len(RECIPE_KEYWORDS)}개 요리 키워드로 크롤링 시작...")
    
    for i, keyword in enumerate(RECIPE_KEYWORDS):
        print(f"\n📝 {i+1}/{len(RECIPE_KEYWORDS)}: '{keyword}' 검색 중...")
        
        # 해당 키워드로 레시피 검색
        recipe_urls = search_recipes(session, keyword, max_pages=2)
        
        if not recipe_urls:
            print(f"    ⚠️ '{keyword}' 검색 결과 없음")
            continue
        
        # 각 레시피 크롤링하여 점수 계산
        keyword_recipes = []
        
        for url in recipe_urls[:10]:  # 키워드당 최대 10개 크롤링
            print(f"    📝 레시피 수집 중...")
            recipe_data = extract_recipe_data(session, url)
            
            if recipe_data and len(recipe_data['ingredients']) >= 3 and len(recipe_data['steps']) >= 2:
                recipe_data['score'] = score_recipe(recipe_data)
                keyword_recipes.append(recipe_data)
                print(f"    ✅ 수집 완료: {recipe_data['name']} (점수: {recipe_data['score']})")
            else:
                print(f"    ⚠️ 데이터 부족으로 스킵")
            
            time.sleep(random.uniform(1, 2))
        
        # 해당 키워드의 최고 점수 레시피 선택
        if keyword_recipes:
            best_recipe = max(keyword_recipes, key=lambda x: x['score'])
            selected_recipes[keyword] = best_recipe
            print(f"    🏆 '{keyword}' 최고 점수 레시피 선택: {best_recipe['name']} (점수: {best_recipe['score']})")
        else:
            print(f"    ❌ '{keyword}' 유효한 레시피 없음")
    
    # 선택된 레시피들을 리스트로 변환
    all_recipes = list(selected_recipes.values())
    
    print(f"\n📊 크롤링 완료: 총 {len(all_recipes)}개 레시피 선택")
    
    # 카테고리별 통계
    category_count = {}
    for recipe in all_recipes:
        category = recipe['category']
        category_count[category] = category_count.get(category, 0) + 1
    
    print("📈 카테고리별 통계:")
    for category, count in category_count.items():
        print(f"   - {category}: {count}개")
    
    # Firebase에 업로드
    print(f"\n🔥 Firebase 업로드 시작...")
    
    try:
        # 기존 레시피 모두 삭제
        print("🗑️ 기존 레시피 삭제 중...")
        recipes_ref = db.collection('recipes')
        docs = recipes_ref.stream()
        for doc in docs:
            doc.reference.delete()
        print("✅ 기존 레시피 삭제 완료")
        
        # 새 레시피 업로드
        print("📤 새 레시피 업로드 중...")
        for i, recipe in enumerate(all_recipes):
            try:
                # score 필드 제거 (Firebase에 저장하지 않음)
                recipe_to_upload = {k: v for k, v in recipe.items() if k != 'score'}
                
                recipes_ref.document(recipe['id']).set(recipe_to_upload)
                print(f"    ✅ {i+1}/{len(all_recipes)}: {recipe['name']} ({recipe['category']}, {recipe['servings']}인분)")
                
            except Exception as e:
                print(f"    ❌ 업로드 실패: {recipe['name']} - {e}")
        
        print(f"\n🎉 완료! {len(all_recipes)}개 레시피가 Firebase에 업로드되었습니다.")
        
    except Exception as e:
        print(f"❌ Firebase 업로드 실패: {e}")

if __name__ == "__main__":
    crawl_recipes()
