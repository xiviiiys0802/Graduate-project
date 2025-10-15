import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyBvOkBw7anT5pYjPq8VQZ8Z8Z8Z8Z8Z8Z8Z8",
  authDomain: "eatsoon-8f8f8.firebaseapp.com",
  projectId: "eatsoon-8f8f8",
  storageBucket: "eatsoon-8f8f8.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456789"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function forceDeleteOldRecipes() {
  console.log('🗑️ 이전 레시피 강제 삭제 시작...');
  
  try {
    // 모든 레시피 가져오기
    const recipesSnapshot = await getDocs(collection(db, 'recipes'));
    const recipes = recipesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`📊 현재 레시피 개수: ${recipes.length}개`);
    
    // 이전 레시피 ID들 (크롤링되지 않은 것들)
    const oldRecipeIds = ['계란말이', '김치찌개', '된장찌개'];
    
    // 이전 레시피 삭제
    const deletions = [];
    for (const recipe of recipes) {
      if (oldRecipeIds.includes(recipe.id)) {
        console.log(`🗑️ 이전 레시피 삭제: ${recipe.name} (ID: ${recipe.id})`);
        deletions.push(deleteDoc(doc(db, 'recipes', recipe.id)));
      } else {
        console.log(`✅ 크롤링 레시피 유지: ${recipe.name} (ID: ${recipe.id})`);
      }
    }
    
    if (deletions.length > 0) {
      await Promise.all(deletions);
      console.log(`✅ ${deletions.length}개 이전 레시피 삭제 완료!`);
    } else {
      console.log('📭 삭제할 이전 레시피가 없습니다.');
    }
    
    // 삭제 후 확인
    const afterSnapshot = await getDocs(collection(db, 'recipes'));
    console.log(`📊 삭제 후 레시피 개수: ${afterSnapshot.docs.length}개`);
    
    afterSnapshot.docs.forEach((doc, index) => {
      console.log(`  ${index + 1}. ${doc.data().name} (ID: ${doc.id})`);
    });
    
  } catch (error) {
    console.error('❌ 삭제 실패:', error);
  }
}

forceDeleteOldRecipes();




