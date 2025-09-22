#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from improved_recipe_crawler import get_session, extract_recipe_data

def main():
    url = 'https://m.10000recipe.com/recipe/6857726'
    session = get_session()
    recipe = extract_recipe_data(session, url)
    if not recipe:
        print('❌ 추출 실패')
        return
    print('이름:', recipe.get('name'))
    steps = recipe.get('steps', [])
    print('단계 수:', len(steps))
    for i, s in enumerate(steps[:10], 1):
        print(f" {i}. {s}")

if __name__ == '__main__':
    main()
