// Firebase에서 기존 레시피 완전 삭제 스크립트
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyB-ApuhEYLl6anQtbCReL-N2D6L7xeT1fQ",
  authDomain: "eatsoon-16f59.firebaseapp.com",
  projectId: "eatsoon-16f59",
  storageBucket: "eatsoon-16f59.firebasestorage.app",
  messagingSenderId: "486393424980",
  appId: "1:486393424980:web:c032a099834c70b78a51c1",
  measurementId: "G-W27HCVN19P"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanFirebase() {
  console.log('🧹 Firebase 정리 시작...');
  
  const snap = await getDocs(collection(db, 'recipes'));
  console.log(`📊 현재 레시피 개수: ${snap.docs.length}개`);
  
  // 기존 레시피 ID들 (한글 이름으로 된 것들)
  const oldRecipeIds = ['계란말이', '김치찌개', '된장찌개'];
  
  for (const docSnapshot of snap.docs) {
    const recipeId = docSnapshot.id;
    const recipeName = docSnapshot.data().name;
    
    if (oldRecipeIds.includes(recipeId) || oldRecipeIds.includes(recipeName)) {
      console.log(`🗑️ 기존 레시피 삭제: ${recipeName} (ID: ${recipeId})`);
      await deleteDoc(doc(collection(db, 'recipes'), recipeId));
    } else {
      console.log(`✅ 크롤링 레시피 유지: ${recipeName} (ID: ${recipeId})`);
    }
  }
  
  // 최종 확인
  const finalSnap = await getDocs(collection(db, 'recipes'));
  console.log(`\n📊 정리 후 레시피 개수: ${finalSnap.docs.length}개`);
  finalSnap.docs.forEach((doc, index) => {
    console.log(`  ${index + 1}. ${doc.data().name} (ID: ${doc.id})`);
  });
  
  console.log('✅ Firebase 정리 완료!');
  process.exit(0);
}

cleanFirebase().catch(console.error);




