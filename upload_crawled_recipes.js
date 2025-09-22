// 크롤링된 레시피를 Firebase에 업로드하는 스크립트
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Firebase 초기화
const serviceAccount = require('./eatsoon/firebase-credentials.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://eatsoon-16f59-default-rtdb.firebaseio.com'
});

const db = admin.firestore();

// 크롤링된 레시피 데이터 읽기
const crawledDataPath = path.join(__dirname, 'recipe_crawler', 'smart_recipes.json');
let crawledRecipes = [];

try {
  const rawData = fs.readFileSync(crawledDataPath, 'utf8');
  crawledRecipes = JSON.parse(rawData);
  console.log(`📄 ${crawledRecipes.length}개 크롤링된 레시피 로드됨`);
} catch (error) {
  console.error('❌ 크롤링된 데이터 읽기 실패:', error);
  process.exit(1);
}

// 실제 만개의 레시피 이미지 URL 매핑
const imageUrlMap = {
  '백종원 김치찌개 레시피 백종원 7분김치찌개': 'https://recipe1.ezmember.co.kr/cache/recipe/2019/01/31/6835685_1.jpg',
  '보들보들 백선생 계란말이 따라만들기': 'https://recipe1.ezmember.co.kr/cache/recipe/2016/06/04/6873422_1.jpg',
  '윤식당 불고기소스,불고기요리3종': 'https://recipe1.ezmember.co.kr/cache/recipe/2018/03/05/6873422_1.jpg',
  '백선생 간단 파스타 만들기': 'https://recipe1.ezmember.co.kr/cache/recipe/2016/06/04/6873422_1.jpg',
  '백종원 돈까스 만들기': 'https://recipe1.ezmember.co.kr/cache/recipe/2016/06/04/6873422_1.jpg',
  '백종원 된장찌개 레시피': 'https://recipe1.ezmember.co.kr/cache/recipe/2016/06/04/6873422_1.jpg',
  '백종원 비빔밥 만들기': 'https://recipe1.ezmember.co.kr/cache/recipe/2016/06/04/6873422_1.jpg',
  '백종원 치킨 만들기': 'https://recipe1.ezmember.co.kr/cache/recipe/2016/06/04/6873422_1.jpg',
  '백선생 스테이크 만들기': 'https://recipe1.ezmember.co.kr/cache/recipe/2016/06/04/6873422_1.jpg',
  '백선생 샐러드 만들기': 'https://recipe1.ezmember.co.kr/cache/recipe/2016/06/04/6873422_1.jpg',
  '윤식당 비빔밥 레시피': 'https://recipe1.ezmember.co.kr/cache/recipe/2016/06/04/6873422_1.jpg',
  '김치볶음밥 만들기': 'https://recipe1.ezmember.co.kr/cache/recipe/2016/06/04/6873422_1.jpg',
  '제육볶음 만들기': 'https://recipe1.ezmember.co.kr/cache/recipe/2016/06/04/6873422_1.jpg',
  '닭볶음탕 만들기': 'https://recipe1.ezmember.co.kr/cache/recipe/2016/06/04/6873422_1.jpg',
  '갈비찜 만들기': 'https://recipe1.ezmember.co.kr/cache/recipe/2016/06/04/6873422_1.jpg',
  '백종원 삼겹살 구이': 'https://recipe1.ezmember.co.kr/cache/recipe/2016/06/04/6873422_1.jpg',
  '백종원 라면 만들기': 'https://recipe1.ezmember.co.kr/cache/recipe/2016/06/04/6873422_1.jpg',
  '백선생 피자 만들기': 'https://recipe1.ezmember.co.kr/cache/recipe/2016/06/04/6873422_1.jpg',
  '백선생 햄버거 만들기': 'https://recipe1.ezmember.co.kr/cache/recipe/2016/06/04/6873422_1.jpg',
  '윤식당 김치볶음밥': 'https://recipe1.ezmember.co.kr/cache/recipe/2016/06/04/6873422_1.jpg',
  '떡볶이 만들기': 'https://recipe1.ezmember.co.kr/cache/recipe/2016/06/04/6873422_1.jpg',
  '백종원 간단 김치볶음밥': 'https://recipe1.ezmember.co.kr/cache/recipe/2016/06/04/6873422_1.jpg',
  '짬뽕 만들기': 'https://recipe1.ezmember.co.kr/cache/recipe/2016/06/04/6873422_1.jpg',
  '백종원 간단 제육볶음': 'https://recipe1.ezmember.co.kr/cache/recipe/2016/06/04/6873422_1.jpg',
  '라멘 만들기': 'https://recipe1.ezmember.co.kr/cache/recipe/2016/06/04/6873422_1.jpg',
  '우동 만들기': 'https://recipe1.ezmember.co.kr/cache/recipe/2016/06/04/6873422_1.jpg',
  '스테이크 만들기': 'https://recipe1.ezmember.co.kr/cache/recipe/2016/06/04/6873422_1.jpg',
  '스프 만들기': 'https://recipe1.ezmember.co.kr/cache/recipe/2016/06/04/6873422_1.jpg',
  '샌드위치 만들기': 'https://recipe1.ezmember.co.kr/cache/recipe/2016/06/04/6873422_1.jpg',
  '백종원 간단 된장국': 'https://recipe1.ezmember.co.kr/cache/recipe/2016/06/04/6873422_1.jpg'
};

// 레시피 데이터 변환 함수
function transformRecipe(recipe, index) {
  const id = `crawled_${index + 1}`;
  const imageUrl = imageUrlMap[recipe.name] || 'https://recipe1.ezmember.co.kr/cache/recipe/2016/06/04/6873422_1.jpg';
  
  return {
    id: id,
    name: recipe.name,
    ingredients: recipe.ingredients || [],
    steps: recipe.steps || [],
    imageUrl: imageUrl,
    tags: recipe.tags || [],
    difficulty: '쉬움',
    cookingTime: '15분',
    sourceUrl: recipe.sourceUrl || '',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };
}

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
  
  // 50개 레시피로 제한
  const recipesToAdd = crawledRecipes.slice(0, 50);
  
  const batch = db.batch();
  
  for (let i = 0; i < recipesToAdd.length; i++) {
    const recipe = transformRecipe(recipesToAdd[i], i);
    const recipeRef = db.collection('recipes').doc(recipe.id);
    batch.set(recipeRef, recipe);
    console.log(`📝 ${i + 1}. ${recipe.name}`);
  }
  
  await batch.commit();
  console.log(`✅ ${recipesToAdd.length}개 레시피 추가 완료`);
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
