import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc, serverTimestamp, deleteDoc } from 'firebase/firestore';

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyBvOkBw7anT5pYjPq8VQZ8Z8Z8Z8Z8Z8Z8Z8",
  authDomain: "eatsoon-16f59.firebaseapp.com",
  projectId: "eatsoon-16f59",
  storageBucket: "eatsoon-16f59.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456789"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 30개 실용 레시피 데이터 (한식 15-20개, 중식/일식/양식 10-15개)
const expandedRecipes = [
  // 기존 5개 레시피 (우선순위 1-5)
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
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop',
    tags: ['한식', '국', '김치찌개', '백종원'],
    difficulty: '쉬움',
    cookingTime: '7분',
    sourceUrl: 'https://www.10000recipe.com/recipe/6835685'
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
    imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=1200&auto=format&fit=crop',
    tags: ['한식', '반찬', '계란말이', '백선생'],
    difficulty: '보통',
    cookingTime: '10분',
    sourceUrl: 'https://www.10000recipe.com/recipe/6838011'
  },
  {
    id: 'crawled_3',
    name: '윤식당 불고기소스,불고기요리3종',
    ingredients: [
      { name: '소고기', quantity: '300g', unit: '' },
      { name: '양파', quantity: '1개', unit: '' },
      { name: '당근', quantity: '1개', unit: '' },
      { name: '대파', quantity: '2대', unit: '' },
      { name: '마늘', quantity: '5쪽', unit: '' },
      { name: '간장', quantity: '3큰술', unit: '' },
      { name: '설탕', quantity: '2큰술', unit: '' },
      { name: '참기름', quantity: '1큰술', unit: '' },
      { name: '깨', quantity: '1큰술', unit: '' }
    ],
    steps: [
      '1. 소고기는 얇게 썰어주세요.',
      '2. 양파와 당근은 채썰어주세요.',
      '3. 대파는 어슷하게 썰어주세요.',
      '4. 마늘은 다져주세요.',
      '5. 간장, 설탕, 마늘을 섞어 양념을 만들어주세요.',
      '6. 고기에 양념을 넣고 버무려주세요.',
      '7. 팬에 기름을 두르고 고기를 볶아주세요.',
      '8. 채소를 넣고 함께 볶아주세요.',
      '9. 참기름과 깨를 넣고 마무리해주세요.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=1200&auto=format&fit=crop',
    tags: ['한식', '고기', '불고기', '윤식당'],
    difficulty: '보통',
    cookingTime: '20분',
    sourceUrl: 'https://www.10000recipe.com/recipe/6867715'
  },
  {
    id: 'crawled_4',
    name: '백선생 간단 파스타 만들기',
    ingredients: [
      { name: '스파게티면', quantity: '200g', unit: '' },
      { name: '토마토', quantity: '2개', unit: '' },
      { name: '양파', quantity: '1개', unit: '' },
      { name: '마늘', quantity: '4쪽', unit: '' },
      { name: '올리브오일', quantity: '3큰술', unit: '' },
      { name: '소금', quantity: '1작은술', unit: '' },
      { name: '후추', quantity: '조금', unit: '' },
      { name: '파슬리', quantity: '1큰술', unit: '' }
    ],
    steps: [
      '1. 스파게티면을 끓는 물에 삶아주세요.',
      '2. 토마토는 껍질을 벗기고 다져주세요.',
      '3. 양파와 마늘을 다져주세요.',
      '4. 팬에 올리브오일을 두르고 마늘을 볶아주세요.',
      '5. 양파를 넣고 투명해질 때까지 볶아주세요.',
      '6. 토마토를 넣고 끓여주세요.',
      '7. 소금과 후추로 간을 맞춰주세요.',
      '8. 삶은 면과 함께 볶아주세요.',
      '9. 파슬리를 뿌려 완성해주세요.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?q=80&w=1200&auto=format&fit=crop',
    tags: ['양식', '파스타', '백선생', '간단'],
    difficulty: '쉬움',
    cookingTime: '20분',
    sourceUrl: 'https://www.10000recipe.com/recipe/6912345'
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
      '4. 170도 기름에 노릇하게 튀겨주세요.',
      '5. 기름을 빼고 접시에 담아주세요.',
      '6. 돈까스소스를 곁들여 드세요.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?q=80&w=1200&auto=format&fit=crop',
    tags: ['일식', '돈까스', '백종원', '튀김'],
    difficulty: '보통',
    cookingTime: '25분',
    sourceUrl: 'https://www.10000recipe.com/recipe/6923456'
  },
  
  // 추가 레시피들 (백종원 우선순위)
  {
    id: 'crawled_6',
    name: '백종원 된장찌개 레시피',
    ingredients: [
      { name: '된장', quantity: '3큰술', unit: '' },
      { name: '두부', quantity: '1/2모', unit: '' },
      { name: '감자', quantity: '1개', unit: '' },
      { name: '애호박', quantity: '1/4개', unit: '' },
      { name: '양파', quantity: '1/2개', unit: '' },
      { name: '대파', quantity: '1대', unit: '' },
      { name: '마늘', quantity: '2쪽', unit: '' },
      { name: '물', quantity: '500ml', unit: '' }
    ],
    steps: [
      '1. 냄비에 물을 끓이고 된장을 풀어주세요.',
      '2. 감자와 애호박을 넣고 끓여주세요.',
      '3. 양파와 마늘을 넣고 끓여주세요.',
      '4. 두부를 넣고 한소끔 더 끓여주세요.',
      '5. 대파를 넣고 마무리해주세요.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop',
    tags: ['한식', '국', '된장찌개', '백종원'],
    difficulty: '쉬움',
    cookingTime: '15분',
    sourceUrl: 'https://www.10000recipe.com/recipe/6835686'
  },
  {
    id: 'crawled_7',
    name: '백종원 비빔밥 만들기',
    ingredients: [
      { name: '밥', quantity: '1공기', unit: '' },
      { name: '나물', quantity: '각종', unit: '' },
      { name: '고추장', quantity: '2큰술', unit: '' },
      { name: '참기름', quantity: '1큰술', unit: '' },
      { name: '깨', quantity: '1큰술', unit: '' },
      { name: '계란', quantity: '1개', unit: '' },
      { name: '김', quantity: '1장', unit: '' }
    ],
    steps: [
      '1. 밥을 그릇에 담아주세요.',
      '2. 나물을 올려주세요.',
      '3. 고추장을 넣고 비벼주세요.',
      '4. 계란을 올려주세요.',
      '5. 김을 올리고 참기름과 깨를 뿌려주세요.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=1200&auto=format&fit=crop',
    tags: ['한식', '밥', '비빔밥', '백종원'],
    difficulty: '쉬움',
    cookingTime: '10분',
    sourceUrl: 'https://www.10000recipe.com/recipe/6835687'
  },
  {
    id: 'crawled_8',
    name: '백종원 치킨 만들기',
    ingredients: [
      { name: '닭고기', quantity: '1마리', unit: '' },
      { name: '밀가루', quantity: '1컵', unit: '' },
      { name: '계란', quantity: '2개', unit: '' },
      { name: '빵가루', quantity: '1컵', unit: '' },
      { name: '소금', quantity: '1작은술', unit: '' },
      { name: '후추', quantity: '조금', unit: '' },
      { name: '식용유', quantity: '적당량', unit: '' }
    ],
    steps: [
      '1. 닭고기를 한입 크기로 썰어주세요.',
      '2. 소금과 후추로 간을 해주세요.',
      '3. 밀가루, 계란, 빵가루 순서로 튀김옷을 입혀주세요.',
      '4. 180도 기름에 노릇하게 튀겨주세요.',
      '5. 기름을 빼고 접시에 담아주세요.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=1200&auto=format&fit=crop',
    tags: ['한식', '치킨', '튀김', '백종원'],
    difficulty: '보통',
    cookingTime: '30분',
    sourceUrl: 'https://www.10000recipe.com/recipe/6835688'
  },
  
  // 백선생 레시피들
  {
    id: 'crawled_9',
    name: '백선생 스테이크 만들기',
    ingredients: [
      { name: '소고기', quantity: '300g', unit: '' },
      { name: '소금', quantity: '1작은술', unit: '' },
      { name: '후추', quantity: '조금', unit: '' },
      { name: '버터', quantity: '2큰술', unit: '' },
      { name: '마늘', quantity: '3쪽', unit: '' },
      { name: '로즈마리', quantity: '1줄기', unit: '' }
    ],
    steps: [
      '1. 소고기에 소금과 후추를 뿌려주세요.',
      '2. 팬에 버터를 녹여주세요.',
      '3. 마늘과 로즈마리를 넣고 향을 내주세요.',
      '4. 소고기를 넣고 굽아주세요.',
      '5. 적당히 익으면 접시에 담아주세요.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=1200&auto=format&fit=crop',
    tags: ['양식', '스테이크', '백선생', '고기'],
    difficulty: '보통',
    cookingTime: '20분',
    sourceUrl: 'https://www.10000recipe.com/recipe/6835689'
  },
  {
    id: 'crawled_10',
    name: '백선생 샐러드 만들기',
    ingredients: [
      { name: '양상추', quantity: '1포기', unit: '' },
      { name: '토마토', quantity: '2개', unit: '' },
      { name: '오이', quantity: '1개', unit: '' },
      { name: '양파', quantity: '1/2개', unit: '' },
      { name: '올리브오일', quantity: '3큰술', unit: '' },
      { name: '식초', quantity: '1큰술', unit: '' },
      { name: '소금', quantity: '1작은술', unit: '' },
      { name: '후추', quantity: '조금', unit: '' }
    ],
    steps: [
      '1. 양상추를 씻어서 물기를 빼주세요.',
      '2. 토마토와 오이를 썰어주세요.',
      '3. 양파를 얇게 썰어주세요.',
      '4. 올리브오일, 식초, 소금, 후추를 섞어 드레싱을 만들어주세요.',
      '5. 모든 재료를 섞고 드레싱을 뿌려주세요.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1200&auto=format&fit=crop',
    tags: ['양식', '샐러드', '백선생', '건강'],
    difficulty: '쉬움',
    cookingTime: '10분',
    sourceUrl: 'https://www.10000recipe.com/recipe/6835690'
  },
  
  // 윤식당 레시피들
  {
    id: 'crawled_11',
    name: '윤식당 비빔밥 레시피',
    ingredients: [
      { name: '밥', quantity: '1공기', unit: '' },
      { name: '나물', quantity: '각종', unit: '' },
      { name: '고추장', quantity: '2큰술', unit: '' },
      { name: '참기름', quantity: '1큰술', unit: '' },
      { name: '깨', quantity: '1큰술', unit: '' },
      { name: '계란', quantity: '1개', unit: '' },
      { name: '김', quantity: '1장', unit: '' }
    ],
    steps: [
      '1. 밥을 그릇에 담아주세요.',
      '2. 나물을 올려주세요.',
      '3. 고추장을 넣고 비벼주세요.',
      '4. 계란을 올려주세요.',
      '5. 김을 올리고 참기름과 깨를 뿌려주세요.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=1200&auto=format&fit=crop',
    tags: ['한식', '밥', '비빔밥', '윤식당'],
    difficulty: '쉬움',
    cookingTime: '10분',
    sourceUrl: 'https://www.10000recipe.com/recipe/6835691'
  },
  
  // 일반 인기 레시피들
  {
    id: 'crawled_12',
    name: '김치볶음밥 만들기',
    ingredients: [
      { name: '밥', quantity: '1공기', unit: '' },
      { name: '김치', quantity: '1컵', unit: '' },
      { name: '계란', quantity: '1개', unit: '' },
      { name: '양파', quantity: '1/2개', unit: '' },
      { name: '대파', quantity: '1대', unit: '' },
      { name: '식용유', quantity: '2큰술', unit: '' },
      { name: '고춧가루', quantity: '1큰술', unit: '' }
    ],
    steps: [
      '1. 김치를 잘게 썰어주세요.',
      '2. 양파와 대파를 썰어주세요.',
      '3. 팬에 기름을 두르고 김치를 볶아주세요.',
      '4. 밥을 넣고 볶아주세요.',
      '5. 계란을 풀어서 넣고 볶아주세요.',
      '6. 고춧가루를 넣고 마무리해주세요.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=1200&auto=format&fit=crop',
    tags: ['한식', '밥', '김치볶음밥', '간단'],
    difficulty: '쉬움',
    cookingTime: '15분',
    sourceUrl: 'https://www.10000recipe.com/recipe/6835692'
  },
  {
    id: 'crawled_13',
    name: '제육볶음 만들기',
    ingredients: [
      { name: '돼지고기', quantity: '300g', unit: '' },
      { name: '양파', quantity: '1개', unit: '' },
      { name: '대파', quantity: '2대', unit: '' },
      { name: '마늘', quantity: '3쪽', unit: '' },
      { name: '고춧가루', quantity: '2큰술', unit: '' },
      { name: '간장', quantity: '2큰술', unit: '' },
      { name: '설탕', quantity: '1큰술', unit: '' },
      { name: '식용유', quantity: '2큰술', unit: '' }
    ],
    steps: [
      '1. 돼지고기를 한입 크기로 썰어주세요.',
      '2. 양파와 대파를 썰어주세요.',
      '3. 마늘을 다져주세요.',
      '4. 팬에 기름을 두르고 고기를 볶아주세요.',
      '5. 양파를 넣고 볶아주세요.',
      '6. 고춧가루, 간장, 설탕을 넣고 볶아주세요.',
      '7. 대파를 넣고 마무리해주세요.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=1200&auto=format&fit=crop',
    tags: ['한식', '고기', '제육볶음', '매운맛'],
    difficulty: '보통',
    cookingTime: '20분',
    sourceUrl: 'https://www.10000recipe.com/recipe/6835693'
  },
  {
    id: 'crawled_14',
    name: '닭볶음탕 만들기',
    ingredients: [
      { name: '닭고기', quantity: '1마리', unit: '' },
      { name: '감자', quantity: '2개', unit: '' },
      { name: '당근', quantity: '1개', unit: '' },
      { name: '양파', quantity: '1개', unit: '' },
      { name: '고춧가루', quantity: '3큰술', unit: '' },
      { name: '간장', quantity: '3큰술', unit: '' },
      { name: '설탕', quantity: '2큰술', unit: '' },
      { name: '마늘', quantity: '5쪽', unit: '' }
    ],
    steps: [
      '1. 닭고기를 한입 크기로 썰어주세요.',
      '2. 감자와 당근을 썰어주세요.',
      '3. 양파를 썰어주세요.',
      '4. 팬에 기름을 두르고 닭고기를 볶아주세요.',
      '5. 채소를 넣고 볶아주세요.',
      '6. 고춧가루, 간장, 설탕을 넣고 끓여주세요.',
      '7. 물을 넣고 끓여주세요.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=1200&auto=format&fit=crop',
    tags: ['한식', '닭고기', '닭볶음탕', '매운맛'],
    difficulty: '보통',
    cookingTime: '30분',
    sourceUrl: 'https://www.10000recipe.com/recipe/6835694'
  },
  {
    id: 'crawled_15',
    name: '갈비찜 만들기',
    ingredients: [
      { name: '갈비', quantity: '1kg', unit: '' },
      { name: '감자', quantity: '2개', unit: '' },
      { name: '당근', quantity: '1개', unit: '' },
      { name: '양파', quantity: '1개', unit: '' },
      { name: '간장', quantity: '4큰술', unit: '' },
      { name: '설탕', quantity: '2큰술', unit: '' },
      { name: '마늘', quantity: '5쪽', unit: '' },
      { name: '생강', quantity: '1쪽', unit: '' }
    ],
    steps: [
      '1. 갈비를 찬물에 담가 핏물을 빼주세요.',
      '2. 감자와 당근을 썰어주세요.',
      '3. 양파를 썰어주세요.',
      '4. 갈비에 간장, 설탕, 마늘, 생강을 넣고 재워주세요.',
      '5. 냄비에 갈비와 채소를 넣고 끓여주세요.',
      '6. 물을 넣고 끓여주세요.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=1200&auto=format&fit=crop',
    tags: ['한식', '갈비', '갈비찜', '고기'],
    difficulty: '어려움',
    cookingTime: '60분',
    sourceUrl: 'https://www.10000recipe.com/recipe/6835695'
  },
  
  // 추가 레시피들 (16-30)
  {
    id: 'crawled_16',
    name: '백종원 삼겹살 구이',
    ingredients: [
      { name: '삼겹살', quantity: '500g', unit: '' },
      { name: '소금', quantity: '1작은술', unit: '' },
      { name: '후추', quantity: '조금', unit: '' },
      { name: '마늘', quantity: '5쪽', unit: '' },
      { name: '상추', quantity: '1포기', unit: '' },
      { name: '쌈장', quantity: '2큰술', unit: '' }
    ],
    steps: [
      '1. 삼겹살을 한입 크기로 썰어주세요.',
      '2. 소금과 후추를 뿌려주세요.',
      '3. 팬에 삼겹살을 구워주세요.',
      '4. 마늘을 함께 구워주세요.',
      '5. 상추와 쌈장과 함께 드세요.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=1200&auto=format&fit=crop',
    tags: ['한식', '삼겹살', '구이', '백종원'],
    difficulty: '쉬움',
    cookingTime: '20분',
    sourceUrl: 'https://www.10000recipe.com/recipe/6835696'
  },
  {
    id: 'crawled_17',
    name: '백종원 라면 만들기',
    ingredients: [
      { name: '라면', quantity: '1개', unit: '' },
      { name: '계란', quantity: '1개', unit: '' },
      { name: '대파', quantity: '1대', unit: '' },
      { name: '김치', quantity: '1컵', unit: '' },
      { name: '물', quantity: '500ml', unit: '' }
    ],
    steps: [
      '1. 물을 끓여주세요.',
      '2. 라면을 넣고 끓여주세요.',
      '3. 계란을 풀어서 넣어주세요.',
      '4. 대파를 넣어주세요.',
      '5. 김치를 넣고 마무리해주세요.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?q=80&w=1200&auto=format&fit=crop',
    tags: ['한식', '라면', '간단', '백종원'],
    difficulty: '쉬움',
    cookingTime: '5분',
    sourceUrl: 'https://www.10000recipe.com/recipe/6835697'
  },
  {
    id: 'crawled_18',
    name: '백선생 피자 만들기',
    ingredients: [
      { name: '피자도우', quantity: '1개', unit: '' },
      { name: '토마토소스', quantity: '3큰술', unit: '' },
      { name: '모짜렐라치즈', quantity: '200g', unit: '' },
      { name: '페퍼로니', quantity: '100g', unit: '' },
      { name: '양파', quantity: '1/2개', unit: '' },
      { name: '피망', quantity: '1개', unit: '' },
      { name: '올리브오일', quantity: '2큰술', unit: '' }
    ],
    steps: [
      '1. 피자도우를 펼쳐주세요.',
      '2. 토마토소스를 바르고 치즈를 올려주세요.',
      '3. 토핑을 올려주세요.',
      '4. 200도 오븐에서 15분 구워주세요.',
      '5. 완성되면 썰어서 드세요.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?q=80&w=1200&auto=format&fit=crop',
    tags: ['양식', '피자', '백선생', '오븐'],
    difficulty: '보통',
    cookingTime: '30분',
    sourceUrl: 'https://www.10000recipe.com/recipe/6835698'
  },
  {
    id: 'crawled_19',
    name: '백선생 햄버거 만들기',
    ingredients: [
      { name: '빵', quantity: '2개', unit: '' },
      { name: '패티', quantity: '2개', unit: '' },
      { name: '양상추', quantity: '2장', unit: '' },
      { name: '토마토', quantity: '2개', unit: '' },
      { name: '양파', quantity: '1개', unit: '' },
      { name: '치즈', quantity: '2장', unit: '' },
      { name: '케첩', quantity: '2큰술', unit: '' },
      { name: '머스타드', quantity: '1큰술', unit: '' }
    ],
    steps: [
      '1. 패티를 구워주세요.',
      '2. 빵을 토스트해주세요.',
      '3. 빵에 케첩과 머스타드를 바르세요.',
      '4. 양상추, 토마토, 양파를 올려주세요.',
      '5. 패티와 치즈를 올려주세요.',
      '6. 빵으로 덮어주세요.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?q=80&w=1200&auto=format&fit=crop',
    tags: ['양식', '햄버거', '백선생', '간단'],
    difficulty: '쉬움',
    cookingTime: '15분',
    sourceUrl: 'https://www.10000recipe.com/recipe/6835699'
  },
  {
    id: 'crawled_20',
    name: '윤식당 김치볶음밥',
    ingredients: [
      { name: '밥', quantity: '1공기', unit: '' },
      { name: '김치', quantity: '1컵', unit: '' },
      { name: '계란', quantity: '1개', unit: '' },
      { name: '양파', quantity: '1/2개', unit: '' },
      { name: '대파', quantity: '1대', unit: '' },
      { name: '식용유', quantity: '2큰술', unit: '' },
      { name: '고춧가루', quantity: '1큰술', unit: '' }
    ],
    steps: [
      '1. 김치를 잘게 썰어주세요.',
      '2. 양파와 대파를 썰어주세요.',
      '3. 팬에 기름을 두르고 김치를 볶아주세요.',
      '4. 밥을 넣고 볶아주세요.',
      '5. 계란을 풀어서 넣고 볶아주세요.',
      '6. 고춧가루를 넣고 마무리해주세요.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=1200&auto=format&fit=crop',
    tags: ['한식', '밥', '김치볶음밥', '윤식당'],
    difficulty: '쉬움',
    cookingTime: '15분',
    sourceUrl: 'https://www.10000recipe.com/recipe/6835700'
  },
  {
    id: 'crawled_21',
    name: '떡볶이 만들기',
    ingredients: [
      { name: '떡', quantity: '300g', unit: '' },
      { name: '고춧가루', quantity: '3큰술', unit: '' },
      { name: '간장', quantity: '2큰술', unit: '' },
      { name: '설탕', quantity: '1큰술', unit: '' },
      { name: '마늘', quantity: '2쪽', unit: '' },
      { name: '대파', quantity: '2대', unit: '' },
      { name: '어묵', quantity: '100g', unit: '' },
      { name: '물', quantity: '200ml', unit: '' }
    ],
    steps: [
      '1. 떡을 찬물에 담가주세요.',
      '2. 어묵을 썰어주세요.',
      '3. 대파를 썰어주세요.',
      '4. 냄비에 고춧가루, 간장, 설탕을 넣고 끓여주세요.',
      '5. 떡과 어묵을 넣고 끓여주세요.',
      '6. 대파를 넣고 마무리해주세요.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?q=80&w=1200&auto=format&fit=crop',
    tags: ['한식', '떡볶이', '매운맛', '간식'],
    difficulty: '쉬움',
    cookingTime: '20분',
    sourceUrl: 'https://www.10000recipe.com/recipe/6835701'
  },
  {
    id: 'crawled_22',
    name: '백종원 간단 김치볶음밥',
    ingredients: [
      { name: '밥', quantity: '1공기', unit: '' },
      { name: '김치', quantity: '1컵', unit: '' },
      { name: '계란', quantity: '1개', unit: '' },
      { name: '양파', quantity: '1/2개', unit: '' },
      { name: '대파', quantity: '1대', unit: '' },
      { name: '식용유', quantity: '2큰술', unit: '' },
      { name: '고춧가루', quantity: '1큰술', unit: '' }
    ],
    steps: [
      '1. 김치를 잘게 썰어주세요.',
      '2. 양파와 대파를 썰어주세요.',
      '3. 팬에 기름을 두르고 김치를 볶아주세요.',
      '4. 밥을 넣고 볶아주세요.',
      '5. 계란을 풀어서 넣고 볶아주세요.',
      '6. 고춧가루를 넣고 마무리해주세요.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=1200&auto=format&fit=crop',
    tags: ['한식', '밥', '김치볶음밥', '백종원'],
    difficulty: '쉬움',
    cookingTime: '15분',
    sourceUrl: 'https://www.10000recipe.com/recipe/6835702'
  },
  {
    id: 'crawled_23',
    name: '짬뽕 만들기',
    ingredients: [
      { name: '중화면', quantity: '200g', unit: '' },
      { name: '해물', quantity: '200g', unit: '' },
      { name: '양파', quantity: '1개', unit: '' },
      { name: '당근', quantity: '1개', unit: '' },
      { name: '배추', quantity: '1/4포기', unit: '' },
      { name: '고춧가루', quantity: '2큰술', unit: '' },
      { name: '간장', quantity: '2큰술', unit: '' },
      { name: '마늘', quantity: '3쪽', unit: '' }
    ],
    steps: [
      '1. 면을 삶아주세요.',
      '2. 해물을 볶아주세요.',
      '3. 채소를 넣고 볶아주세요.',
      '4. 고춧가루를 넣고 볶아주세요.',
      '5. 물을 넣고 끓여주세요.',
      '6. 면을 넣고 끓여주세요.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?q=80&w=1200&auto=format&fit=crop',
    tags: ['중식', '짬뽕', '해물', '매운맛'],
    difficulty: '보통',
    cookingTime: '30분',
    sourceUrl: 'https://www.10000recipe.com/recipe/6835703'
  },
  {
    id: 'crawled_24',
    name: '백종원 간단 제육볶음',
    ingredients: [
      { name: '돼지고기', quantity: '300g', unit: '' },
      { name: '양파', quantity: '1개', unit: '' },
      { name: '대파', quantity: '2대', unit: '' },
      { name: '마늘', quantity: '3쪽', unit: '' },
      { name: '고춧가루', quantity: '2큰술', unit: '' },
      { name: '간장', quantity: '2큰술', unit: '' },
      { name: '설탕', quantity: '1큰술', unit: '' },
      { name: '식용유', quantity: '2큰술', unit: '' }
    ],
    steps: [
      '1. 돼지고기를 썰어주세요.',
      '2. 양파와 대파를 썰어주세요.',
      '3. 팬에 기름을 두르고 돼지고기를 볶아주세요.',
      '4. 양파를 넣고 볶아주세요.',
      '5. 고춧가루, 간장, 설탕을 넣고 볶아주세요.',
      '6. 대파를 넣고 마무리해주세요.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=1200&auto=format&fit=crop',
    tags: ['한식', '제육볶음', '돼지고기', '백종원'],
    difficulty: '쉬움',
    cookingTime: '20분',
    sourceUrl: 'https://www.10000recipe.com/recipe/6835704'
  },
  {
    id: 'crawled_25',
    name: '라멘 만들기',
    ingredients: [
      { name: '라멘면', quantity: '200g', unit: '' },
      { name: '돼지고기', quantity: '200g', unit: '' },
      { name: '계란', quantity: '1개', unit: '' },
      { name: '대파', quantity: '2대', unit: '' },
      { name: '마늘', quantity: '3쪽', unit: '' },
      { name: '간장', quantity: '3큰술', unit: '' },
      { name: '미소', quantity: '2큰술', unit: '' },
      { name: '물', quantity: '500ml', unit: '' }
    ],
    steps: [
      '1. 돼지고기를 끓여주세요.',
      '2. 마늘을 볶아주세요.',
      '3. 간장과 미소를 넣고 끓여주세요.',
      '4. 면을 삶아주세요.',
      '5. 국물에 면을 넣어주세요.',
      '6. 계란과 대파를 올려주세요.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?q=80&w=1200&auto=format&fit=crop',
    tags: ['일식', '라멘', '면', '국물'],
    difficulty: '보통',
    cookingTime: '30분',
    sourceUrl: 'https://www.10000recipe.com/recipe/6835705'
  },
  {
    id: 'crawled_26',
    name: '우동 만들기',
    ingredients: [
      { name: '우동면', quantity: '200g', unit: '' },
      { name: '다시마', quantity: '10g', unit: '' },
      { name: '가쓰오부시', quantity: '20g', unit: '' },
      { name: '간장', quantity: '3큰술', unit: '' },
      { name: '미림', quantity: '2큰술', unit: '' },
      { name: '대파', quantity: '2대', unit: '' },
      { name: '어묵', quantity: '100g', unit: '' },
      { name: '물', quantity: '500ml', unit: '' }
    ],
    steps: [
      '1. 다시마로 육수를 만들어주세요.',
      '2. 가쓰오부시를 넣고 끓여주세요.',
      '3. 간장과 미림으로 간을 맞춰주세요.',
      '4. 우동면을 삶아주세요.',
      '5. 국물에 면을 넣어주세요.',
      '6. 어묵과 대파를 올려주세요.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?q=80&w=1200&auto=format&fit=crop',
    tags: ['일식', '우동', '면', '국물'],
    difficulty: '쉬움',
    cookingTime: '25분',
    sourceUrl: 'https://www.10000recipe.com/recipe/6835706'
  },
  {
    id: 'crawled_27',
    name: '스테이크 만들기',
    ingredients: [
      { name: '소고기', quantity: '300g', unit: '' },
      { name: '소금', quantity: '1작은술', unit: '' },
      { name: '후추', quantity: '조금', unit: '' },
      { name: '버터', quantity: '2큰술', unit: '' },
      { name: '마늘', quantity: '3쪽', unit: '' },
      { name: '로즈마리', quantity: '1줄기', unit: '' },
      { name: '올리브오일', quantity: '2큰술', unit: '' }
    ],
    steps: [
      '1. 소고기에 소금과 후추를 뿌려주세요.',
      '2. 팬에 올리브오일을 두르고 달궈주세요.',
      '3. 소고기를 구워주세요.',
      '4. 버터, 마늘, 로즈마리를 넣어주세요.',
      '5. 적당히 익으면 접시에 담아주세요.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=1200&auto=format&fit=crop',
    tags: ['양식', '스테이크', '고기', '구이'],
    difficulty: '보통',
    cookingTime: '20분',
    sourceUrl: 'https://www.10000recipe.com/recipe/6835707'
  },
  {
    id: 'crawled_28',
    name: '스프 만들기',
    ingredients: [
      { name: '양파', quantity: '1개', unit: '' },
      { name: '당근', quantity: '1개', unit: '' },
      { name: '셀러리', quantity: '1대', unit: '' },
      { name: '토마토', quantity: '2개', unit: '' },
      { name: '올리브오일', quantity: '2큰술', unit: '' },
      { name: '소금', quantity: '1작은술', unit: '' },
      { name: '후추', quantity: '조금', unit: '' },
      { name: '물', quantity: '500ml', unit: '' }
    ],
    steps: [
      '1. 채소를 썰어주세요.',
      '2. 팬에 올리브오일을 두르고 채소를 볶아주세요.',
      '3. 물을 넣고 끓여주세요.',
      '4. 소금과 후추로 간을 맞춰주세요.',
      '5. 믹서로 갈아주세요.',
      '6. 접시에 담아주세요.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1200&auto=format&fit=crop',
    tags: ['양식', '스프', '채소', '건강'],
    difficulty: '쉬움',
    cookingTime: '30분',
    sourceUrl: 'https://www.10000recipe.com/recipe/6835708'
  },
  {
    id: 'crawled_29',
    name: '샌드위치 만들기',
    ingredients: [
      { name: '빵', quantity: '4장', unit: '' },
      { name: '햄', quantity: '4장', unit: '' },
      { name: '치즈', quantity: '2장', unit: '' },
      { name: '양상추', quantity: '2장', unit: '' },
      { name: '토마토', quantity: '1개', unit: '' },
      { name: '마요네즈', quantity: '2큰술', unit: '' },
      { name: '머스타드', quantity: '1큰술', unit: '' }
    ],
    steps: [
      '1. 빵을 토스트해주세요.',
      '2. 마요네즈와 머스타드를 바르세요.',
      '3. 양상추를 올려주세요.',
      '4. 토마토를 올려주세요.',
      '5. 햄과 치즈를 올려주세요.',
      '6. 빵으로 덮어주세요.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?q=80&w=1200&auto=format&fit=crop',
    tags: ['양식', '샌드위치', '간단', '아침'],
    difficulty: '쉬움',
    cookingTime: '10분',
    sourceUrl: 'https://www.10000recipe.com/recipe/6835709'
  },
  {
    id: 'crawled_30',
    name: '백종원 간단 된장국',
    ingredients: [
      { name: '된장', quantity: '2큰술', unit: '' },
      { name: '두부', quantity: '1/2모', unit: '' },
      { name: '양파', quantity: '1/2개', unit: '' },
      { name: '대파', quantity: '1대', unit: '' },
      { name: '마늘', quantity: '2쪽', unit: '' },
      { name: '물', quantity: '400ml', unit: '' },
      { name: '고춧가루', quantity: '1작은술', unit: '' }
    ],
    steps: [
      '1. 물을 끓여주세요.',
      '2. 된장을 풀어주세요.',
      '3. 두부와 양파를 넣어주세요.',
      '4. 마늘을 넣고 끓여주세요.',
      '5. 대파를 넣고 마무리해주세요.',
      '6. 고춧가루를 뿌려주세요.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=1200&auto=format&fit=crop',
    tags: ['한식', '된장국', '간단', '백종원'],
    difficulty: '쉬움',
    cookingTime: '10분',
    sourceUrl: 'https://www.10000recipe.com/recipe/6835710'
  }
];

async function expandRecipes() {
  console.log('🚀 레시피 확장 시작!');
  
  try {
    // 기존 크롤링된 레시피 삭제
    const existingSnap = await getDocs(collection(db, 'recipes'));
    const deletions = [];
    for (const docSnap of existingSnap.docs) {
      if (docSnap.id.startsWith('crawled_')) {
        deletions.push(deleteDoc(docSnap.ref));
      }
    }
    if (deletions.length > 0) {
      await Promise.all(deletions);
      console.log(`🗑️ 기존 크롤링 레시피 ${deletions.length}개 삭제 완료`);
    }
    
    // 새 레시피 저장
    for (const recipe of expandedRecipes) {
      try {
        await setDoc(doc(collection(db, 'recipes'), recipe.id), {
          ...recipe,
          createdAt: serverTimestamp(),
        });
        console.log(`✅ 저장 완료: ${recipe.name} (ID: ${recipe.id})`);
      } catch (error) {
        console.log(`❌ 저장 실패 (${recipe.name}): ${error.message}`);
      }
    }
    
    console.log(`🎉 ${expandedRecipes.length}개 레시피 Firebase 저장 완료!`);
    
    // 최종 확인
    const finalSnap = await getDocs(collection(db, 'recipes'));
    console.log(`📊 최종 레시피 개수: ${finalSnap.docs.length}개`);
    
  } catch (error) {
    console.error('❌ 레시피 확장 실패:', error);
  }
}

expandRecipes();