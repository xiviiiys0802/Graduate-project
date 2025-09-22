#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
from bs4 import BeautifulSoup
import re

def debug_detailed():
    """상세한 HTML 구조 디버깅"""
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    })
    
    # 간단한 레시피 URL
    test_url = "https://www.10000recipe.com/recipe/3686217"
    
    try:
        print(f"🔍 디버깅 URL: {test_url}")
        response = session.get(test_url, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # 제목 찾기
        print("\n=== 제목 찾기 ===")
        title_selectors = [
            'h3.view2_summary_info3',
            'h1.view2_summary_info3', 
            'h3',
            'h1',
            '.view2_summary_info3',
            '.summary_info3'
        ]
        
        for selector in title_selectors:
            elements = soup.select(selector)
            if elements:
                print(f"✅ {selector}: {elements[0].get_text(strip=True)}")
            else:
                print(f"❌ {selector}: 없음")
        
        # 조리법 섹션 찾기
        print("\n=== 조리법 섹션 찾기 ===")
        step_selectors = [
            '.view_step',
            '.step',
            '.cooking_step',
            '.recipe_step',
            '[class*="step"]'
        ]
        
        for selector in step_selectors:
            elements = soup.select(selector)
            print(f"{selector}: {len(elements)}개")
            
            if elements:
                for i, elem in enumerate(elements[:2]):  # 처음 2개만
                    print(f"  {i+1}. {elem.get_text()[:100]}...")
        
        # 모든 텍스트에서 불릿 찾기
        print("\n=== 전체 텍스트에서 불릿 찾기 ===")
        all_text = soup.get_text()
        bullet_chars = ['•', 'ㆍ', '●', '◦', '▪', '▫', '◆', '◇', '★', '☆']
        
        for char in bullet_chars:
            if char in all_text:
                print(f"✅ '{char}' 발견")
                # 불릿 주변 텍스트 찾기
                lines = all_text.split('\n')
                for line in lines:
                    if char in line:
                        print(f"  - {line.strip()[:100]}...")
            else:
                print(f"❌ '{char}' 없음")
                
    except Exception as e:
        print(f"❌ 디버깅 실패: {e}")

if __name__ == "__main__":
    debug_detailed()
