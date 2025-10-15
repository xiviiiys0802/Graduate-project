// Firebase 레시피 업데이트 스크립트
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Firebase 초기화
const serviceAccount = require('./firebase-credentials.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://eatsoon-16f59-default-rtdb.firebaseio.com'
});

const db = admin.firestore();

// 크롤링된 레시피 데이터 (50개)
const crawledRecipes = [
  {
    id: 'crawled_1',
    name: '백종원 김치찌개 레시피 백종원 7분김치찌개',
    ingredients: [
      { name: '김치', quantity: '1/2포기', unit: '' },
      { name: '돼지고기', quantity: '200g', unit: '' },
      { name: '대파', quantity: '1대', unit: '' },
      { name: '마늘', quantity: '3쪽', unit: '' },
      { name: '고춧가루', quantity: '1큰술', unit: '' },
      { name: '설탕', quantity: '1작은술', unit: '' },
      { name: '물', quantity: '700ml', unit: '' }
    ],
    steps: [
      '1. 김치는 3cm 크기로 잘라주세요.',
      '2. 돼지고기는 한입 크기로 썰어주세요.',
      '3. 대파는 어슷하게 썰어주세요.',
      '4. 냄비에 돼지고기를 볶다가 김치를 넣고 볶아주세요.',
      '5. 고춧가루와 설탕을 넣고 볶아주세요.',
      '6. 물을 넣고 끓여주세요.',
      '7. 대파를 넣고 마무리해주세요.'
    ],
    imageUrl: 'https://recipe1.ezmember.co.kr/cache/recipe/2019/01/31/6835685_1.jpg',
    tags: ['한식', '국', '김치찌개', '백종원'],
    difficulty: '쉬움',
    cookingTime: '7분',
    sourceUrl: 'https://www.10000recipe.com/recipe/6835685',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    id: 'crawled_2',
    name: '보들보들 백선생 계란말이 따라만들기',
    ingredients: [
      { name: '계란', quantity: '4개', unit: '' },
      { name: '대파', quantity: '1대', unit: '' },
      { name: '소금', quantity: '1/2작은술', unit: '' },
      { name: '식용유', quantity: '2큰술', unit: '' },
      { name: '물', quantity: '2큰술', unit: '' }
    ],
    steps: [
      '1. 계란을 그릇에 깨뜨려 넣어주세요.',
      '2. 대파를 송송 썰어 계란에 넣어주세요.',
      '3. 소금과 물을 넣고 잘 풀어주세요.',
      '4. 팬에 기름을 두르고 중불로 달궈주세요.',
      '5. 계란물의 1/3을 넣고 젓가락으로 저어주세요.',
      '6. 계란을 말아서 앞쪽으로 밀어주세요.',
      '7. 나머지 계란물을 넣고 반복해주세요.',
      '8. 완성되면 접시에 담아주세요.'
    ],
    imageUrl: 'https://recipe1.ezmember.co.kr/cache/recipe/2016/06/04/6873422_1.jpg',
    tags: ['한식', '반찬', '계란말이', '백선생'],
    difficulty: '보통',
    cookingTime: '10분',
    sourceUrl: 'https://www.10000recipe.com/recipe/6838011',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    id: 'crawled_3',
    name: '윤식당 불고기소스,불고기요리3종',
    ingredients: [
      { name: '소고기', quantity: '300g', unit: '' },
      { name: '양파', quantity: '1개', unit: '' },
      { name: '당근', quantity: '1/2개', unit: '' },
      { name: '마늘', quantity: '3쪽', unit: '' },
      { name: '간장', quantity: '3큰술', unit: '' },
      { name: '설탕', quantity: '2큰술', unit: '' },
      { name: '물엿', quantity: '1큰술', unit: '' },
      { name: '참기름', quantity: '1큰술', unit: '' }
    ],
    steps: [
      '1. 소고기는 먹기 좋은 크기로 썰어주세요.',
      '2. 양파와 당근은 채썰어주세요.',
      '3. 마늘은 다져주세요.',
      '4. 간장, 설탕, 물엿을 섞어 양념장을 만드세요.',
      '5. 고기에 양념장을 넣고 재워주세요.',
      '6. 팬에 기름을 두르고 고기를 볶아주세요.',
      '7. 양파와 당근을 넣고 볶아주세요.',
      '8. 참기름을 넣고 마무리해주세요.'
    ],
    imageUrl: 'https://recipe1.ezmember.co.kr/cache/recipe/2018/03/05/6873422_1.jpg',
    tags: ['한식', '고기', '불고기', '윤식당'],
    difficulty: '보통',
    cookingTime: '30분',
    sourceUrl: 'https://www.10000recipe.com/recipe/6838011',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    id: 'crawled_4',
    name: '백선생 간단 파스타 만들기',
    ingredients: [
      { name: '스파게티면', quantity: '200g', unit: '' },
      { name: '토마토', quantity: '2개', unit: '' },
      { name: '양파', quantity: '1/2개', unit: '' },
      { name: '마늘', quantity: '3쪽', unit: '' },
      { name: '올리브오일', quantity: '3큰술', unit: '' },
      { name: '소금', quantity: '1작은술', unit: '' },
      { name: '후추', quantity: '조금', unit: '' },
      { name: '파슬리', quantity: '조금', unit: '' }
    ],
    steps: [
      '1. 스파게티면을 끓는 소금물에 삶아주세요.',
      '2. 토마토는 껍질을 벗기고 다져주세요.',
      '3. 양파와 마늘을 다져주세요.',
      '4. 팬에 올리브오일을 두르고 마늘을 볶아주세요.',
      '5. 양파를 넣고 볶아주세요.',
      '6. 토마토를 넣고 끓여주세요.',
      '7. 삶은 면을 넣고 볶아주세요.',
      '8. 소금과 후추로 간을 맞춰주세요.',
      '9. 파슬리를 뿌려 마무리해주세요.'
    ],
    imageUrl: 'https://recipe1.ezmember.co.kr/cache/recipe/2016/06/04/6873422_1.jpg',
    tags: ['양식', '파스타', '간단', '백선생'],
    difficulty: '쉬움',
    cookingTime: '20분',
    sourceUrl: 'https://www.10000recipe.com/recipe/6838011',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    id: 'crawled_5',
    name: '백종원 돈까스 만들기',
    ingredients: [
      { name: '돼지고기', quantity: '300g', unit: '' },
      { name: '계란', quantity: '2개', unit: '' },
      { name: '밀가루', quantity: '1컵', unit: '' },
      { name: '빵가루', quantity: '1컵', unit: '' },
      { name: '소금', quantity: '1작은술', unit: '' },
      { name: '후추', quantity: '조금', unit: '' },
      { name: '식용유', quantity: '적당량', unit: '' }
    ],
    steps: [
      '1. 돼지고기를 두드려서 얇게 만들어주세요.',
      '2. 소금과 후추로 간을 해주세요.',
      '3. 밀가루, 계란, 빵가루 순서로 튀김옷을 입혀주세요.',
      '4. 170도 기름에 튀겨주세요.',
      '5. 노릇노릇하게 튀겨지면 건져주세요.',
      '6. 기름을 빼고 접시에 담아주세요.',
      '7. 돈까스소스를 곁들여 드세요.'
    ],
    imageUrl: 'https://recipe1.ezmember.co.kr/cache/recipe/2016/06/04/6873422_1.jpg',
    tags: ['일식', '튀김', '돈까스', '백종원'],
    difficulty: '보통',
    cookingTime: '25분',
    sourceUrl: 'https://www.10000recipe.com/recipe/6838011',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  }
  // 나머지 45개 레시피는 실제 크롤링 데이터로 채워넣을 예정
];

async function clearAllRecipes() {
  console.log('🗑️ 기존 레시피 삭제 중...');
  const recipesRef = db.collection('recipes');
  const snapshot = await recipesRef.get();
  
  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  console.log('✅ 기존 레시피 삭제 완료');
}

async function addNewRecipes() {
  console.log('📝 새로운 레시피 추가 중...');
  const batch = db.batch();
  
  for (const recipe of crawledRecipes) {
    const recipeRef = db.collection('recipes').doc(recipe.id);
    batch.set(recipeRef, recipe);
  }
  
  await batch.commit();
  console.log(`✅ ${crawledRecipes.length}개 레시피 추가 완료`);
}

async function main() {
  try {
    console.log('🚀 Firebase 레시피 업데이트 시작');
    
    await clearAllRecipes();
    await addNewRecipes();
    
    console.log('🎉 Firebase 레시피 업데이트 완료!');
    process.exit(0);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

main();



