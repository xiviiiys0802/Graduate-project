#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
from bs4 import BeautifulSoup
import re
import time
import random

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
        # 괄호 내용 제거
        step = re.sub(r'\([^)]*\)', '', step)
        step = re.sub(r'\[[^\]]*\]', '', step)
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
        # 본문 + 회색 보조설명(•/ㆍ/● 불릿)의 구조를 괄호로 합성
        # 불릿으로 시작하는 부분을 찾아서 괄호로 처리
        bullet_pattern = r'([^•ㆍ●]+?)([•ㆍ●]\s*[^•ㆍ●]+)'
        match = re.search(bullet_pattern, step)
        if match:
            main_text = match.group(1).strip()
            sub_tip = match.group(2).replace('•', '').replace('ㆍ', '').replace('●', '').strip()
            if main_text and sub_tip:
                step = f"{main_text} ({sub_tip})"
        # 너무 긴 문장은 자르기
        if len(step) > 180:
            step = step[:180].rstrip() + '…'
        if step and len(step) >= 5:
            cleaned_steps.append(step)

    return cleaned_steps

def test_recipe_steps():
    """레시피 단계 포맷팅 테스트"""
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    })
    
    # 테스트할 레시피 URL
    test_urls = [
        "https://www.10000recipe.com/recipe/6874631",  # 김치찌개
        "https://www.10000recipe.com/recipe/6874632",  # 된장찌개
    ]
    
    for url in test_urls:
        try:
            print(f"\n🔍 테스트 URL: {url}")
            response = session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # 조리법 추출
            steps = []
            step_sections = soup.find_all('div', class_='view_step')
            
            for section in step_sections:
                step_items = section.find_all('div', class_='view_step_cont')
                for item in step_items:
                    # HTML 구조를 유지하면서 텍스트 추출
                    step_text = ""
                    for element in item.descendants:
                        if element.name is None:  # 텍스트 노드
                            step_text += element.string
                        elif element.name in ['br']:  # 줄바꿈
                            step_text += " "
                        elif element.name in ['span', 'em', 'strong']:  # 스타일 태그는 무시
                            continue
                    
                    step_text = re.sub(r'\s+', ' ', step_text).strip()
                    if step_text and '밀키트' not in step_text:
                        steps.append(step_text)
            
            print(f"📋 원본 단계 수: {len(steps)}")
            for i, step in enumerate(steps[:3], 1):  # 처음 3개만 출력
                print(f"  {i}. {step}")
            
            # 정리된 단계
            cleaned_steps = clean_recipe_steps(steps)
            print(f"\n✨ 정리된 단계 수: {len(cleaned_steps)}")
            for i, step in enumerate(cleaned_steps[:3], 1):  # 처음 3개만 출력
                print(f"  {i}. {step}")
                
        except Exception as e:
            print(f"❌ 테스트 실패: {e}")

if __name__ == "__main__":
    test_recipe_steps()
