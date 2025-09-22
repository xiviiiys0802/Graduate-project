#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
from bs4 import BeautifulSoup
import re
import time

def find_bullet_recipes():
    """불릿이 포함된 레시피 찾기"""
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    })
    
    # 김치찌개 검색
    search_url = "https://www.10000recipe.com/recipe/list.html?q=김치찌개"
    
    try:
        print(f"🔍 검색 URL: {search_url}")
        response = session.get(search_url, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # 레시피 링크 찾기
        recipe_links = []
        link_elements = soup.find_all('a', href=re.compile(r'/recipe/\d+'))
        for link in link_elements[:5]:  # 처음 5개만
            href = link.get('href')
            if href and href.startswith('/recipe/'):
                recipe_links.append('https://www.10000recipe.com' + href)
        
        print(f"📋 찾은 레시피 링크: {len(recipe_links)}")
        
        for i, url in enumerate(recipe_links):
            print(f"\n--- 레시피 {i+1}: {url} ---")
            
            try:
                response = session.get(url, timeout=10)
                response.raise_for_status()
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # 제목
                title_elem = soup.find('h3', class_='view2_summary_info3') or soup.find('h1', class_='view2_summary_info3')
                title = title_elem.get_text(strip=True) if title_elem else "제목 없음"
                print(f"제목: {title}")
                
                # 조리법에서 불릿 찾기
                step_sections = soup.find_all('div', class_='view_step')
                bullet_found = False
                
                for section in step_sections:
                    step_items = section.find_all('div', class_='view_step_cont')
                    for item in step_items:
                        text = item.get_text()
                        if '•' in text or 'ㆍ' in text or '●' in text:
                            print(f"⚠️ 불릿 발견: {text[:100]}...")
                            bullet_found = True
                            break
                    if bullet_found:
                        break
                
                if not bullet_found:
                    print("❌ 불릿 없음")
                    
            except Exception as e:
                print(f"❌ 레시피 확인 실패: {e}")
            
            time.sleep(1)  # 요청 간격
            
    except Exception as e:
        print(f"❌ 검색 실패: {e}")

if __name__ == "__main__":
    find_bullet_recipes()
