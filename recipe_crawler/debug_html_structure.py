#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
from bs4 import BeautifulSoup
import re

def debug_recipe_html():
    """레시피 HTML 구조 디버깅"""
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    })
    
    # 테스트할 레시피 URL
    test_url = "https://www.10000recipe.com/recipe/6874631"
    
    try:
        print(f"🔍 디버깅 URL: {test_url}")
        response = session.get(test_url, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # 조리법 섹션 찾기
        step_sections = soup.find_all('div', class_='view_step')
        print(f"📋 조리법 섹션 수: {len(step_sections)}")
        
        for i, section in enumerate(step_sections):
            print(f"\n--- 섹션 {i+1} ---")
            step_items = section.find_all('div', class_='view_step_cont')
            print(f"단계 아이템 수: {len(step_items)}")
            
            for j, item in enumerate(step_items[:2]):  # 처음 2개만
                print(f"\n  단계 {j+1} HTML 구조:")
                print(f"  {item}")
                print(f"\n  단계 {j+1} 텍스트:")
                print(f"  {item.get_text()}")
                
                # 불릿이나 특수 문자 찾기
                text = item.get_text()
                if '•' in text or 'ㆍ' in text or '●' in text:
                    print(f"  ⚠️ 불릿 발견: {text}")
                
                # span 태그들 확인
                spans = item.find_all('span')
                if spans:
                    print(f"  📝 span 태그들:")
                    for span in spans:
                        print(f"    - {span}")
                
    except Exception as e:
        print(f"❌ 디버깅 실패: {e}")

if __name__ == "__main__":
    debug_recipe_html()
