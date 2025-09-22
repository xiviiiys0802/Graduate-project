// src/utils/recommendation.js
function toDateSafe(v) {
  if (!v) return null;
  if (typeof v?.toDate === 'function') return v.toDate();
  return new Date(v);
}

function daysUntil(exp) {
  const d = toDateSafe(exp);
  if (!d || Number.isNaN(d.getTime())) return 9999;
  const now = new Date();
  return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
}

export function normalizeName(s = '') {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function indexPantry(pantry = []) {
  const map = new Map();
  for (const p of pantry) {
    const key = normalizeName(p.normalizedName || p.name);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(p);
  }
  return map;
}

// 재료 이름 매칭을 위한 유틸리티 함수
export function findMatchingPantryItem(ingredientName, pantryIdx) {
  const normalizedIngredient = normalizeName(ingredientName);
  
  // 1. 정확한 매칭 시도
  if (pantryIdx.has(normalizedIngredient)) {
    return pantryIdx.get(normalizedIngredient);
  }
  
  // 2. 부분 매칭 시도 (재료 이름이 포함된 경우)
  for (const [pantryKey, items] of pantryIdx) {
    if (normalizedIngredient.includes(pantryKey) || pantryKey.includes(normalizedIngredient)) {
      return items;
    }
  }
  
  // 3. 키워드 매칭 시도 (공통 키워드 찾기)
  const ingredientWords = normalizedIngredient.split(' ');
  for (const [pantryKey, items] of pantryIdx) {
    const pantryWords = pantryKey.split(' ');
    const commonWords = ingredientWords.filter(word => 
      pantryWords.some(pantryWord => 
        word.includes(pantryWord) || pantryWord.includes(word)
      )
    );
    if (commonWords.length > 0) {
      return items;
    }
  }
  
  return [];
}

export function scoreRecipe(recipe, pantryIdx, weights = { wUrgency: 1.2, wMatch: 2.0, wMissing: 1.0 }) {
  const raw = recipe.ingredients || [];
  const needed = raw.map(it => (typeof it === 'string' ? { name: it } : it));

  let match = 0;
  let urgency = 0;
  const missing = [];

  for (const ing of needed) {
    const ingredientName = ing.normalizedName || ing.name || '';
    if (!ingredientName) continue;

    // 물은 매칭/부족 계산에서 완전히 제외 (총 필요 개수에서도 빼기)
    const isWater = ingredientName.trim() === '물' || ingredientName.trim() === 'water' || ingredientName.startsWith('물');
    if (isWater) {
      continue;
    }

    // 새로운 매칭 로직 사용
    const stocks = findMatchingPantryItem(ingredientName, pantryIdx);
    
    // 재료 이름만으로 매칭 (양은 무시)
    if (stocks.length > 0) {
      match += 1;
      const soonest = stocks.reduce((a, b) => {
        const da = daysUntil(a?.expirationDate);
        const db = daysUntil(b?.expirationDate);
        return db < da ? b : a;
      }, stocks[0]);
      const d = daysUntil(soonest?.expirationDate);
      urgency += Math.max(0, 14 - d);
    } else {
      // 물은 부족한 재료에서 제외
      const ingredientName = ing.name?.trim() || '';
      if (ingredientName !== '물' && ingredientName !== 'water') {
        missing.push({
          name: ingredientName,
          quantity: ing.quantity ?? 1,
          unit: ing.unit?.trim(),
        });
      }
    }
  }

  const neededCount = needed.filter(n => {
    const nname = (n.name || '').trim();
    return nname !== '물' && nname !== 'water' && !nname.startsWith('물');
  })?.length || 0;
  const ratio = neededCount ? match / neededCount : 0;
  const score = weights.wUrgency * urgency + weights.wMatch * ratio - weights.wMissing * (missing?.length || 0);

  return { score, matchCount: match, neededCount, missing };
}

export function recommendRecipes(recipes = [], pantry = [], options = { topK: 20, maxMissing: Infinity, onlyFullMatch: false }) {
  const { topK = 20, maxMissing = Infinity, onlyFullMatch = false } = options;
  const idx = indexPantry(pantry);

  const ranked = recipes
    .map(r => ({ ...r, ...scoreRecipe(r, idx) }))
    .filter(r => (onlyFullMatch ? r.matchCount === r.neededCount : true))
    .filter(r => (r.missing?.length || 0) <= maxMissing)
    .sort((a, b) => b.score - a.score);

  return ranked.slice(0, topK);
}

// 전체 레시피 검색 함수
export function searchRecipes(recipes = [], query = '') {
  if (!query.trim()) return recipes;
  
  const normalizedQuery = normalizeName(query);
  return recipes.filter(recipe => {
    const recipeName = normalizeName(recipe.name || '');
    const recipeTags = (recipe.tags || []).map(tag => normalizeName(tag)).join(' ');
    
    return recipeName.includes(normalizedQuery) || 
           recipeTags.includes(normalizedQuery) ||
           (recipe.ingredients || []).some(ing => 
             normalizeName(typeof ing === 'string' ? ing : ing.name || '').includes(normalizedQuery)
           );
  });
}

// 유통기한 임박 재료 기반 추천 함수
export function recommendByExpiringIngredients(recipes = [], pantry = [], minExpiringCount = 3) {
  const expiringItems = pantry.filter(item => {
    const days = daysUntil(item.expiryDate);
    return days <= 3 && days >= 0; // 3일 이내 유통기한
  });
  
  if (expiringItems.length < minExpiringCount) return [];
  
  const expiringNames = expiringItems.map(item => normalizeName(item.normalizedName || item.name));
  const pantryIdx = indexPantry(pantry);
  
  return recipes.filter(recipe => {
    const ingredients = recipe.ingredients || [];
    // 유통기한 임박 재료가 최소 3개 이상 포함된 레시피만 추천
    let hits = 0;
    for (const ing of ingredients) {
      const ingredientName = normalizeName(typeof ing === 'string' ? ing : ing.name || '');
      if (expiringNames.some(expiringName => ingredientName.includes(expiringName) || expiringName.includes(ingredientName))) {
        hits++;
        if (hits >= minExpiringCount) break;
      }
    }
    return hits >= minExpiringCount;
  }).map(recipe => {
    return { ...recipe, ...scoreRecipe(recipe, pantryIdx) };
  }).sort((a, b) => b.score - a.score);
}

// 현재 재료로 만들 수 있는 레시피 (3분의 2 이상 보유)
export function recommendByAvailableIngredients(recipes = [], pantry = []) {
  const pantryIdx = indexPantry(pantry);
  
  return recipes.filter(recipe => {
    const ingredients = recipe.ingredients || [];
    if (ingredients.length === 0) return false;
    
    // 물을 제외한 재료만 계산
    const nonWaterIngredients = ingredients.filter(ing => {
      const ingredientName = typeof ing === 'string' ? ing : ing.name || '';
      return ingredientName.trim() !== '물' && ingredientName.trim() !== 'water';
    });
    
    if (nonWaterIngredients.length === 0) return true; // 물만 있는 경우는 항상 가능
    
    let availableCount = 0;
    for (const ing of nonWaterIngredients) {
      const ingredientName = normalizeName(typeof ing === 'string' ? ing : ing.name || '');
      if (ingredientName && findMatchingPantryItem(ingredientName, pantryIdx).length > 0) {
        availableCount++;
      }
    }
    
    // 3분의 2 이상 보유 (물 제외)
    return availableCount >= Math.ceil(nonWaterIngredients.length * 2 / 3);
  }).map(recipe => {
    return { ...recipe, ...scoreRecipe(recipe, pantryIdx) };
  }).sort((a, b) => b.score - a.score);
}


