import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@food_inventory';

export const saveFoodItems = async (items) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('음식 아이템 저장 실패:', error);
  }
};

export const loadFoodItems = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('음식 아이템 불러오기 실패:', error);
    return [];
  }
};

export const deleteFoodItem = async (itemId) => {
  try {
    const items = await loadFoodItems();
    const updatedItems = items.filter(item => item.id !== itemId);
    await saveFoodItems(updatedItems);
    return updatedItems;
  } catch (error) {
    console.error('음식 아이템 삭제 실패:', error);
    return [];
  }
};