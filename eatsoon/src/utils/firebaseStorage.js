import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const COLLECTION_NAME = 'food_items';

// 현재 사용자 UID 가져오기
const getCurrentUserUid = () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('사용자가 로그인되어 있지 않습니다.');
  }
  return user.uid;
};

// 사용자별 음식 아이템 컬렉션 참조 가져오기
const getUserFoodItemsCollection = () => {
  const uid = getCurrentUserUid();
  return collection(db, 'users', uid, COLLECTION_NAME);
};

// 음식 아이템 저장
export const saveFoodItemToFirestore = async (foodItem) => {
  try {
    const userCollection = getUserFoodItemsCollection();
    const docRef = await addDoc(userCollection, {
      ...foodItem,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('음식 아이템 저장 실패:', error);
    throw error;
  }
};

// 사용자의 모든 음식 아이템 불러오기
export const loadFoodItemsFromFirestore = async () => {
  try {
    const userCollection = getUserFoodItemsCollection();
    const q = query(userCollection, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const items = [];
    querySnapshot.forEach((doc) => {
      items.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return items;
  } catch (error) {
    console.error('음식 아이템 불러오기 실패:', error);
    throw error;
  }
};

// 음식 아이템 수정
export const updateFoodItemInFirestore = async (itemId, updateData) => {
  try {
    const uid = getCurrentUserUid();
    const itemDoc = doc(db, 'users', uid, COLLECTION_NAME, itemId);
    
    await updateDoc(itemDoc, {
      ...updateData,
      updatedAt: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('음식 아이템 수정 실패:', error);
    throw error;
  }
};

// 음식 아이템 삭제
export const deleteFoodItemFromFirestore = async (itemId) => {
  try {
    const uid = getCurrentUserUid();
    const itemDoc = doc(db, 'users', uid, COLLECTION_NAME, itemId);
    
    await deleteDoc(itemDoc);
    return true;
  } catch (error) {
    console.error('음식 아이템 삭제 실패:', error);
    throw error;
  }
};

// 유통기한 임박 아이템 조회
export const getExpiringSoonItems = async (daysThreshold = 3) => {
  try {
    const items = await loadFoodItemsFromFirestore();
    const now = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(now.getDate() + daysThreshold);
    
    return items.filter(item => {
      const expirationDate = new Date(item.expirationDate);
      return expirationDate <= thresholdDate && expirationDate >= now;
    });
  } catch (error) {
    console.error('유통기한 임박 아이템 조회 실패:', error);
    throw error;
  }
};