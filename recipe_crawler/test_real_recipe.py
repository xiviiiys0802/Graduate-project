#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
from bs4 import BeautifulSoup
import re

def test_real_recipe():
    """실제 레시피에서 보조설명 찾기"""
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    })
    
    # 실제 크롤링에서 사용하는 URL들 중 하나
    test_urls = [
        "https://www.10000recipe.com/recipe/3686217",  # 김치찌개
        "https://www.10000recipe.com/recipe/6835685",  # 김치찌개
    ]
    
    for url in test_urls:
        try:
            print(f"\n🔍 테스트 URL: {url}")
            response = session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # 제목
            title_elem = soup.find('h3') or soup.find('h1')
            title = title_elem.get_text(strip=True) if title_elem else "제목 없음"
            print(f"제목: {title}")
            
            # 조리법 섹션 상세 분석
            step_sections = soup.find_all('div', class_='view_step')
            print(f"조리법 섹션 수: {len(step_sections)}")
            
            for i, section in enumerate(step_sections[:2]):  # 처음 2개 섹션만
                print(f"\n--- 섹션 {i+1} ---")
                step_items = section.find_all('div', class_='view_step_cont')
                print(f"단계 아이템 수: {len(step_items)}")
                
                for j, item in enumerate(step_items[:3]):  # 처음 3개 단계만
                    print(f"\n  단계 {j+1}:")
                    print(f"  HTML: {str(item)[:200]}...")
                    
                    # 모든 하위 요소 확인
                    all_elements = item.find_all()
                    print(f"  하위 요소 수: {len(all_elements)}")
                    
                    for elem in all_elements[:5]:  # 처음 5개 요소만
                        print(f"    - {elem.name}: {elem.get_text()[:50]}...")
                    
                    # 텍스트 추출 (기존 방식)
                    old_text = item.get_text(strip=True)
                    print(f"  기존 방식: {old_text[:100]}...")
                    
                    # 새로운 방식
                    main_text = ""
                    sub_text = ""
                    
                    # 메인 텍스트
                    main_elements = item.find_all(['div', 'p'], recursive=False)
                    if main_elements:
                        for elem in main_elements:
                            main_text += elem.get_text(strip=True) + " "
                    else:
                        main_text = item.get_text(strip=True)
                    
                    # 보조 텍스트
                    sub_elements = item.find_all('span', class_=re.compile(r'.*small.*|.*gray.*|.*tip.*|.*note.*', re.I))
                    for elem in sub_elements:
                        sub_text += elem.get_text(strip=True) + " "
                    
                    print(f"  메인 텍스트: {main_text[:100]}...")
                    print(f"  보조 텍스트: {sub_text[:100]}...")
                    
                    if main_text and sub_text:
                        combined = f"{main_text.strip()} ({sub_text.strip()})"
                        print(f"  결합 결과: {combined[:100]}...")
                    else:
                        print(f"  결합 결과: {main_text.strip()[:100]}...")
                    
        except Exception as e:
            print(f"❌ 테스트 실패: {e}")

if __name__ == "__main__":
    test_real_recipe()
