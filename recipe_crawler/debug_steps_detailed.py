#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
from bs4 import BeautifulSoup
import re

def debug_steps_detailed():
    """단계별 상세 디버깅"""
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
    })
    
    url = 'https://m.10000recipe.com/recipe/6857726'
    # 모바일을 데스크톱으로 변환
    url = url.replace('https://m.10000recipe.com', 'https://www.10000recipe.com')
    
    try:
        print(f"🔍 디버깅 URL: {url}")
        response = session.get(url, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # 단계 블록 찾기
        step_items = soup.find_all('div', id=re.compile(r'^stepDiv\d+$'))
        print(f"단계 블록 수: {len(step_items)}")
        
        for i, item in enumerate(step_items[:3]):  # 처음 3개만
            print(f"\n--- 단계 {i+1} ---")
            print(f"ID: {item.get('id')}")
            print(f"클래스: {item.get('class')}")
            
            # 원본 HTML
            print(f"HTML: {str(item)[:300]}...")
            
            # 원본 텍스트
            raw_text = item.get_text('\n', strip=True)
            print(f"원본 텍스트: {raw_text[:200]}...")
            
            # 줄별로 분리
            lines = [ln.strip() for ln in raw_text.split('\n') if ln and ln.strip()]
            print(f"줄 수: {len(lines)}")
            for j, line in enumerate(lines):
                print(f"  {j+1}: {line}")
            
            # 불릿 감지
            bullet_lines = []
            non_bullet_lines = []
            
            for line in lines:
                if re.match(r'^[•ㆍ●★☆◆◇▪▫]\s*', line):
                    bullet_lines.append(line)
                    print(f"  불릿 감지: {line}")
                else:
                    non_bullet_lines.append(line)
            
            print(f"불릿 줄 수: {len(bullet_lines)}")
            print(f"일반 줄 수: {len(non_bullet_lines)}")
            
            # span 태그들 확인
            spans = item.find_all('span')
            print(f"span 태그 수: {len(spans)}")
            for span in spans[:3]:
                print(f"  span: {span.get('class')} - {span.get_text()[:50]}...")
                
    except Exception as e:
        print(f"❌ 디버깅 실패: {e}")

if __name__ == "__main__":
    debug_steps_detailed()
