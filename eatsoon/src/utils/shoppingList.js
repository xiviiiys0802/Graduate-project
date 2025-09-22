// src/utils/shoppingList.js
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

function requireUid() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('로그인이 필요합니다.');
  return uid;
}

function itemsCollectionRef() {
  const uid = requireUid();
  return collection(db, `users/${uid}/shopping_list`);
}

// 재료 이름에서 수량과 단위 제거하는 함수
const normalizeName = (raw) => {
  const base = (raw || '').trim();
  
  // 여러 단계로 나누어 처리
  let cleaned = base;
  
  // 1. 괄호 내용 제거
  cleaned = cleaned.replace(/\([^\)]*\)/g, '');
  
  // 2. 숫자+단위 패턴 제거 (g만 유지하고 나머지 모든 단위 제거)
  cleaned = cleaned
    // 분수+모든 단위 패턴 (1/2개, 1/2모, 1/2마리, 1/2컵, 1/2T 등) - g 제외
    .replace(/(\d+\/\d+)\s*(개|모|마리|장|대|줌|종이컵|소주컵|컵|T|t|스푼|큰술|작은술|ml|L|리터|밀리리터|그램|킬로)/gi, '')
    // 정수+모든 단위 패턴 (3개, 2마리, 1컵, 2T 등) - g 제외
    .replace(/(\d+)\s*(개|모|마리|장|대|줌|종이컵|소주컵|컵|T|t|스푼|큰술|작은술|ml|L|리터|밀리리터|그램|킬로)/gi, '')
    // 붙어서 쓴 모든 단위 패턴 (3개, 2마리, 1컵, 2T 등) - g 제외
    .replace(/(\d+)(개|모|마리|장|대|줌|종이컵|소주컵|컵|T|t|스푼|큰술|작은술|ml|L|리터|밀리리터|그램|킬로)/gi, '')
    // 수량 관련 단어 제거 (약간, 조금, 넉넉히 등)
    .replace(/(조금|약간|넉넉히)\s*/g, '');
  
  // 3. 숫자로 시작하는 패턴 제거 (앞에 숫자만 있는 경우)
  cleaned = cleaned.replace(/^\d+(?:\/\d+)?\s*/g, '');
  
  // 4. 공백 정리
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();
  
  return cleaned || base;
};

// 재료에서 수량을 추출하는 함수
const extractQuantity = (raw) => {
  const base = (raw || '').trim();
  
  // g 단위가 있는 경우 수량을 1로 고정
  if (base.match(/\d+\s*g|\d+g/gi)) {
    return 1;
  }
  
  // 용량 단위가 있는 경우 수량을 1로 고정 (컵, T, 스푼 등)
  if (base.match(/\d+\s*(종이컵|소주컵|컵|T|t|스푼|큰술|작은술|ml|L|리터|밀리리터|그램|킬로)|\d+(종이컵|소주컵|컵|T|t|스푼|큰술|작은술|ml|L|리터|밀리리터|그램|킬로)/gi)) {
    return 1;
  }
  
  // 개수 단위만 수량 추출 (개, 모, 마리, 장, 대, 줄)
  // 분수 패턴 (1/2개, 1/2모 등)
  const fractionMatch = base.match(/(\d+\/\d+)\s*(개|모|마리|장|대|줌)/gi);
  if (fractionMatch) {
    const fraction = fractionMatch[0].match(/(\d+)\/(\d+)/);
    if (fraction) {
      const numerator = parseInt(fraction[1]);
      const denominator = parseInt(fraction[2]);
      return Math.ceil(numerator / denominator); // 분수를 올림하여 자연수로
    }
  }
  
  // 정수 패턴 (3개, 2마리 등)
  const integerMatch = base.match(/(\d+)\s*(개|모|마리|장|대|줌)/gi);
  if (integerMatch) {
    const number = integerMatch[0].match(/(\d+)/);
    if (number) {
      return parseInt(number[1]);
    }
  }
  
  // 붙어서 쓴 패턴 (3개, 2마리 등)
  const attachedMatch = base.match(/(\d+)(개|모|마리|장|대|줌)/gi);
  if (attachedMatch) {
    const number = attachedMatch[0].match(/(\d+)/);
    if (number) {
      return parseInt(number[1]);
    }
  }
  
  // 기본값
  return 1;
};

// Add a single item (with quantity merging for same names)
export async function addItem(name, quantity = 1, unit = '개') {
  const colRef = itemsCollectionRef();
  const trimmedName = normalizeName(name); // 수량과 단위 제거된 이름 사용
  const extractedQty = extractQuantity(name); // 이름에서 수량 추출
  const finalQuantity = extractedQty > 1 ? extractedQty : Number(quantity); // 추출된 수량이 있으면 사용, 없으면 기본값
  const trimmedUnit = unit.trim();
  const numQuantity = finalQuantity;
  
  // Check if item with same name already exists
  const existingItems = await getDocs(colRef);
  const existingItem = existingItems.docs.find(doc => {
    const data = doc.data();
    return data.name === trimmedName && data.unit === trimmedUnit;
  });
  
  if (existingItem) {
    // Update existing item quantity
    const currentQuantity = existingItem.data().quantity || 0;
    const newQuantity = currentQuantity + numQuantity;
    
    await updateDoc(doc(colRef, existingItem.id), {
      quantity: newQuantity,
      updatedAt: serverTimestamp(),
    });
    
    console.log(`📝 기존 재료 수량 업데이트: ${trimmedName} (${currentQuantity} + ${numQuantity} = ${newQuantity}${trimmedUnit})`);
    return existingItem.id;
  } else {
    // Create new item
    const id = doc(colRef).id;
    
    await setDoc(doc(colRef, id), {
      name: trimmedName,
      quantity: numQuantity,
      unit: trimmedUnit,
      checked: false,
      fromRecipeId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    console.log(`➕ 새 재료 추가: ${trimmedName} (${numQuantity}${trimmedUnit})`);
    return id;
  }
}

// Toggle check status
export async function toggleCheck(itemId) {
  const colRef = itemsCollectionRef();
  const itemRef = doc(colRef, itemId);
  
  // Get current item to toggle checked status
  const snap = await getDocs(colRef);
  const item = snap.docs.find(d => d.id === itemId);
  
  if (!item) throw new Error('항목을 찾을 수 없습니다.');
  
  const currentData = item.data();
  await updateDoc(itemRef, {
    checked: !currentData.checked,
    updatedAt: serverTimestamp(),
  });
}

// Update item
export async function updateItem(itemId, updates) {
  const colRef = itemsCollectionRef();
  const itemRef = doc(colRef, itemId);
  
  await updateDoc(itemRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// Delete item
export async function deleteItem(itemId) {
  const colRef = itemsCollectionRef();
  const itemRef = doc(colRef, itemId);
  
  await deleteDoc(itemRef);
}

// List all items with real-time subscription
export function listAll(callback) {
  const colRef = itemsCollectionRef();
  
  return onSnapshot(colRef, (snapshot) => {
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(items);
  }, (error) => {
    console.error('Shopping list subscription error:', error);
    callback([]);
  });
}

// Mark all items as checked
export async function markAllChecked() {
  const colRef = itemsCollectionRef();
  const snap = await getDocs(colRef);
  
  const updatePromises = snap.docs
    .filter(doc => !doc.data().checked)
    .map(doc => updateDoc(doc.ref, {
      checked: true,
      updatedAt: serverTimestamp(),
    }));
  
  await Promise.all(updatePromises);
}

// Delete all checked items
export async function deleteAllChecked() {
  const colRef = itemsCollectionRef();
  const snap = await getDocs(colRef);
  
  const deletePromises = snap.docs
    .filter(doc => doc.data().checked)
    .map(doc => deleteDoc(doc.ref));
  
  await Promise.all(deletePromises);
}

// Add many items; merge by name+unit if unchecked item exists, increment quantity
export async function addItemsMerged(missing = [], { recipeId } = {}) {
  const colRef = itemsCollectionRef();
  const snap = await getDocs(colRef);
  const existing = snap.docs.map(d => ({ id: d.id, ...d.data() }));


  const parseQuantity = (rawQty) => {
    if (rawQty === undefined || rawQty === null || rawQty === '') return 1;
    const s = String(rawQty).trim();
    // 혼합수 '1 1/2' → 올림 2
    const m = s.match(/^(\d+)\s+(\d+\/\d+)$/);
    if (m) {
      const whole = Number(m[1]);
      const [a, b] = m[2].split('/').map(Number);
      const val = whole + (b ? a / b : 0);
      return Math.ceil(val);
    }
    // 순수 분수 '1/2' → 올림 1
    const frac = s.match(/^(\d+\/\d+)$/);
    if (frac) {
      const [a, b] = frac[1].split('/').map(Number);
      const val = b ? a / b : Number(s);
      return Math.ceil(val || 1);
    }
    const num = Number(s);
    return Number.isFinite(num) ? Math.max(1, Math.ceil(num)) : 1;
  };

  const normalizeUnit = (rawUnit) => {
    const allowed = new Set(['개','g','ml','컵','스푼']);
    let u = (rawUnit || '').trim().toLowerCase();
    // 동의어 매핑
    const map = {
      '개': '개', 'ea': '개', 'pcs': '개', '장': '개', '대': '개', '줌': '개',
      'g': 'g', '그램': 'g',
      'kg': 'g', '킬로': 'g', // kg → g로 통일
      'ml': 'ml', '밀리리터': 'ml',
      'l': 'ml', '리터': 'ml', // L → ml로 통일
      'cup': '컵', '컵': '컵',
      '큰술': '스푼', '작은술': '스푼', '스푼': '스푼', 'ts': '스푼', 'tsp': '스푼', 'tbsp': '스푼'
    };
    u = map[u] || u;
    if (!allowed.has(u)) return '';
    // 환산 배수: kg→g(1000), L→ml(1000)
    const multiplier = rawUnit && /kg|킬로/i.test(rawUnit) ? 1000 : (rawUnit && /(^l$|리터)/i.test(rawUnit) ? 1000 : 1);
    return { unit: u, multiplier };
  };

  const isWaterName = (raw) => {
    const s = (raw || '').trim();
    const unitKeywords = ['종이컵','컵','소주컵','ml','l','L','cup'];
    const startsWithMul = s.startsWith('물');
    const looksMeasured = unitKeywords.some(u => s.toLowerCase().includes(u.toLowerCase()));
    if (s === '물' || s.toLowerCase() === 'water') return true;
    if (startsWithMul && looksMeasured && !s.startsWith('물엿')) return true;
    return false;
  };

  const isMeatName = (name) => {
    const meatKeywords = [
      '소고기', '돼지고기', '닭고기', '양고기', '오리고기', '쇠고기',
      '삼겹살', '목살', '갈비', '등심', '안심', '우둔', '사태', '양지',
      '닭가슴살', '닭다리', '닭봉', '닭날개', '닭안심',
      '돼지갈비', '돼지등갈비', '돼지목살', '돼지안심', '돼지갈비살',
      '베이컨', '햄', '소시지', '살라미',
      '고기', '육류', '정육'
    ];
    const normalizedName = name.toLowerCase();
    return meatKeywords.some(keyword => normalizedName.includes(keyword));
  };

  for (const m of missing) {
    const rawName = (m.name || '').trim();
    if (isWaterName(rawName)) continue; // 물은 제외
    const name = normalizeName(rawName);
    const extractedQty = extractQuantity(rawName); // 이름에서 수량 추출
    
    // 고기류 재료인 경우 특별 처리
    let unit, qty;
    if (isMeatName(name)) {
      unit = 'g';
      // 고기류는 50g 단위로 조정 (최소 50g)
      const rawQty = extractedQty > 1 ? extractedQty : parseQuantity(m.quantity);
      const rawUnit = m.unit || '';
      let baseGrams = rawQty;
      
      // 단위 변환 (kg -> g)
      if (rawUnit.toLowerCase().includes('kg') || rawUnit.toLowerCase().includes('킬로')) {
        baseGrams = rawQty * 1000;
      }
      
      // 50g 단위로 올림
      qty = Math.max(50, Math.ceil(baseGrams / 50) * 50);
    } else {
      const norm = normalizeUnit(m.unit || '');
      unit = typeof norm === 'object' ? norm.unit : norm;
      const multiplier = typeof norm === 'object' ? norm.multiplier : 1;
      // 이름에서 추출된 수량이 있으면 사용, 없으면 기존 로직 사용
      const baseQty = extractedQty > 1 ? extractedQty : parseQuantity(m.quantity);
      qty = baseQty * multiplier;
    }

    const found = existing.find(
      it => (it.name || '').trim().toLowerCase() === name.toLowerCase()
        && ((it.unit || '').trim() === unit)
        && !it.checked
    );

    if (found) {
      await updateDoc(doc(colRef, found.id), {
        quantity: Number(found.quantity ?? 0) + qty,
        updatedAt: serverTimestamp(),
      });
    } else {
      const id = doc(colRef).id;
      await setDoc(doc(colRef, id), {
        name,
        unit,
        quantity: qty,
        checked: false,
        fromRecipeId: recipeId || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }
}


