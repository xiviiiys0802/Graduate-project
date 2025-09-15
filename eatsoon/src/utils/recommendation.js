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

export function scoreRecipe(recipe, pantryIdx, weights = { wUrgency: 1.2, wMatch: 2.0, wMissing: 1.0 }) {
  const raw = recipe.ingredients || [];
  const needed = raw.map(it => (typeof it === 'string' ? { name: it } : it));

  let match = 0;
  let urgency = 0;
  const missing = [];

  for (const ing of needed) {
    const key = normalizeName(ing.normalizedName || ing.name || '');
    if (!key) continue;

    const stocks = pantryIdx.get(key) || [];
    const needQty = ing.quantity ?? 0;
    const hasEnough = stocks.some(s => (s.quantity ?? 0) >= needQty);

    if (hasEnough) {
      match += 1;
      const soonest = stocks.reduce((a, b) => {
        const da = daysUntil(a?.expirationDate);
        const db = daysUntil(b?.expirationDate);
        return db < da ? b : a;
      }, stocks[0]);
      const d = daysUntil(soonest?.expirationDate);
      urgency += Math.max(0, 14 - d);
    } else {
      missing.push({
        name: ing.name?.trim(),
        quantity: ing.quantity ?? 1,
        unit: ing.unit?.trim(),
      });
    }
  }

  const neededCount = needed.length;
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


