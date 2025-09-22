// Firebase 레시피 상태 확인 스크립트
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

async function checkRecipes() {
  console.log('🔍 Firebase 레시피 상태 확인...');
  
  const snap = await getDocs(collection(db, 'recipes'));
  console.log(`📊 현재 Firebase에 있는 레시피 개수: ${snap.docs.length}개`);
  
  snap.docs.forEach((doc, index) => {
    const data = doc.data();
    console.log(`  ${index + 1}. ${data.name} (ID: ${doc.id})`);
    console.log(`     재료: ${data.ingredients?.length || 0}개`);
    console.log(`     조리과정: ${data.steps?.length || 0}단계`);
  });
  
  process.exit(0);
}

checkRecipes().catch(console.error);


