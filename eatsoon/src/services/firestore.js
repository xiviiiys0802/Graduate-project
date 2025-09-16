// src/services/firestore.js
import { collection, getDocs, onSnapshot, doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export function requireUid() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('로그인이 필요합니다.');
  return uid;
}

export function normalize(s = '') {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function subscribePantry(callback) {
  const uid = requireUid();
  return onSnapshot(collection(db, `users/${uid}/food_items`), (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(data);
  });
}

export async function fetchRecipesOnce() {
  const snap = await getDocs(collection(db, 'recipes'));
  const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  // 크롤링된 레시피만 필터링 (ID가 'crawled_'로 시작하는 것들)
  const crawledRecipes = arr.filter(r => r.id.startsWith('crawled_'));
  
  console.log(`📊 Firebase에서 가져온 레시피: ${arr.length}개`);
  console.log(`📊 크롤링된 레시피: ${crawledRecipes.length}개`);
  
  const nameToRecipe = new Map();
  for (const r of crawledRecipes) {
    const key = normalize(r.name || '');
    const prev = nameToRecipe.get(key);
    if (!prev) nameToRecipe.set(key, r);
  }
  
  const result = Array.from(nameToRecipe.values());
  console.log(`📊 최종 반환할 레시피: ${result.length}개`);
  result.forEach((r, index) => {
    console.log(`  ${index + 1}. ${r.name} (ID: ${r.id})`);
  });
  
  return result;
}

export async function seedRecipesIfEmpty() {
  const samples = [
    {
      name: '된장찌개',
      ingredients: ['된장', '두부', '감자', '애호박', '양파', '대파'],
      steps: ['냄비에 물을 끓이고 된장을 풀어요.', '감자, 애호박, 양파를 넣고 끓여요.', '두부와 대파를 넣고 한소끔 더 끓여요.'],
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop',
      tags: ['국','한식'],
      createdAt: serverTimestamp(),
    },
    {
      name: '김치찌개',
      ingredients: ['김치', '돼지고기', '두부', '양파', '대파'],
      steps: ['냄비에 돼지고기를 볶다가 김치를 넣고 볶아요.', '물(또는 육수)을 넣고 끓여요.', '두부와 대파로 마무리해요.'],
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop',
      tags: ['국','한식'],
      createdAt: serverTimestamp(),
    },
    {
      name: '계란말이',
      ingredients: ['계란', '대파', '소금', '당근'],
      steps: ['계란을 풀고 간을 해요.', '대파/당근을 섞어요.', '팬에서 말아 완성해요.'],
      imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=1200&auto=format&fit=crop',
      tags: ['반찬','한식'],
      createdAt: serverTimestamp(),
    }
  ];
  for (const r of samples) {
    const id = normalize(r.name);
    await setDoc(doc(collection(db, 'recipes'), id), r, { merge: true });
  }
  return true;
}

export async function dedupeRecipesByName() {
  const snap = await getDocs(collection(db, 'recipes'));
  const arr = snap.docs.map(d => ({ id: d.id, ref: d.ref, ...d.data() }));
  const groups = new Map();
  for (const r of arr) {
    const key = normalize(r.name || '');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }
  const deletions = [];
  for (const [, items] of groups) {
    if ((items?.length || 0) <= 1) continue;
    items.sort((a, b) => {
      const at = a.createdAt?.toMillis?.() ? a.createdAt.toMillis() : 0;
      const bt = b.createdAt?.toMillis?.() ? b.createdAt.toMillis() : 0;
      return bt - at;
    });
    for (let i = 1; i < (items?.length || 0); i++) deletions.push(deleteDoc(items[i].ref));
  }
  if ((deletions?.length || 0)) await Promise.all(deletions);
}

export async function clearAllRecipes() {
  try {
    const snap = await getDocs(collection(db, 'recipes'));
    const deletions = [];
    
    for (const docSnapshot of snap.docs) {
      deletions.push(deleteDoc(docSnapshot.ref));
    }
    
    if (deletions.length > 0) {
      await Promise.all(deletions);
      console.log(`🗑️ 기존 레시피 ${deletions.length}개 삭제 완료`);
    } else {
      console.log('📭 삭제할 기존 레시피가 없습니다');
    }
  } catch (error) {
    console.error('❌ 레시피 삭제 실패:', error);
  }
}

export async function addCrawledRecipes() {
  console.warn('⚠️ addCrawledRecipes 비활성화: 로컬 data 파일 제거됨. 최신 크롤러를 사용하세요.');
}

export async function replaceWithCrawledRecipes() {
  console.warn('⚠️ replaceWithCrawledRecipes 비활성화: 로컬 data 파일 제거됨. 최신 크롤러를 사용하세요.');
}

export async function addMassiveCrawledRecipes() {
  try {
    console.log('📝 대규모 크롤링된 레시피 추가 중...');
    console.log('⚠️ 지원 종료된 기능입니다. 최신 크롤러를 사용해 주세요.');
  } catch (error) {
    console.error('❌ 대규모 레시피 추가 실패:', error);
    throw error;
  }
}


