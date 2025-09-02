// src/screens/MoreScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { subscribePantry, fetchRecipesOnce, seedRecipesIfEmpty, dedupeRecipesByName } from '../services/firestore';
import { recommendRecipes } from '../utils/recommendation';
import { addItem, toggleCheck, updateItem, deleteItem, listAll } from '../utils/shoppingList';

export default function MoreScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('recipe'); // 'recipe' or 'shopping'
  
  // 레시피 추천 관련 상태
  const [loading, setLoading] = useState(true);
  const [pantry, setPantry] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [onlyFullMatch, setOnlyFullMatch] = useState(false);
  const [maxMissing, setMaxMissing] = useState(99);
  
  // 장보기 리스트 관련 상태
  const [shoppingItems, setShoppingItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [shoppingLoading, setShoppingLoading] = useState(true);

  // 레시피 추천 데이터 로드
  useEffect(() => {
    let unsubAuth;
    let unsubPantry;

    unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setPantry([]); 
        setRecipes([]); 
        setLoading(false);
        return;
      }
      unsubPantry = subscribePantry(setPantry);
      await seedRecipesIfEmpty();
      await dedupeRecipesByName();
      const r = await fetchRecipesOnce();
      setRecipes(r);
      setLoading(false);
    });

    return () => { 
      if (unsubAuth) unsubAuth(); 
      if (unsubPantry) unsubPantry(); 
    };
  }, []);

  // 장보기 리스트 데이터 로드
  useEffect(() => {
    const unsubscribe = listAll((items) => {
      const sortedItems = items.sort((a, b) => {
        if (a.checked !== b.checked) {
          return a.checked ? 1 : -1;
        }
        if (!a.checked && !b.checked) {
          return (a.name || '').localeCompare(b.name || '');
        }
        const aTime = a.updatedAt?.toDate?.() || new Date(0);
        const bTime = b.updatedAt?.toDate?.() || new Date(0);
        return bTime - aTime;
      });
      setShoppingItems(sortedItems);
      setShoppingLoading(false);
    });

    return unsubscribe;
  }, []);

  // 추천 레시피 계산
  const rankedRecipes = React.useMemo(() => {
    if (loading) return [];
    return recommendRecipes(recipes, pantry, {
      topK: 5, // 더보기에서는 5개만 표시
      maxMissing,
      onlyFullMatch,
    });
  }, [loading, recipes, pantry, maxMissing, onlyFullMatch]);

  // 장보기 리스트 추가
  const handleAddItem = async () => {
    if (!newItemName.trim()) return;
    try {
      await addItem(newItemName.trim(), 1, '개');
      setNewItemName('');
    } catch (error) {
      Alert.alert('오류', '항목 추가에 실패했습니다.');
    }
  };

  // 장보기 리스트 체크 토글
  const handleToggleCheck = async (itemId) => {
    try {
      await toggleCheck(itemId);
    } catch (error) {
      Alert.alert('오류', '상태 변경에 실패했습니다.');
    }
  };

  // 장보기 리스트 수량 변경
  const handleUpdateQuantity = async (itemId, currentQuantity, delta) => {
    const newQuantity = Math.max(1, currentQuantity + delta);
    try {
      await updateItem(itemId, { quantity: newQuantity });
    } catch (error) {
      Alert.alert('오류', '수량 변경에 실패했습니다.');
    }
  };

  // 장보기 리스트 삭제
  const handleDeleteItem = async (itemId) => {
    Alert.alert(
      '삭제 확인',
      '이 항목을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteItem(itemId);
            } catch (error) {
              Alert.alert('오류', '삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const renderRecipeItem = ({ item }) => (
    <View style={styles.recipeItem}>
      <View style={styles.recipeContent}>
        <Text style={styles.recipeTitle} numberOfLines={2}>
          {item.title || item.name}
        </Text>
        <Text style={styles.recipeInfo}>
          매칭 {item.matchCount}/{item.neededCount} · 부족 {item.missing.length}개
        </Text>
        <TouchableOpacity 
          style={styles.recipeButton}
          onPress={() => {
            const safe = {
              id: item.id,
              name: item.name,
              imageUrl: item.imageUrl,
              ingredients: item.ingredients,
              steps: item.steps,
            };
            navigation.navigate('RecipeDetail', { recipe: safe });
          }}
        >
          <Text style={styles.recipeButtonText}>자세히 보기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderShoppingItem = ({ item }) => (
    <View style={styles.shoppingItem}>
      <TouchableOpacity 
        style={styles.shoppingCheckbox}
        onPress={() => handleToggleCheck(item.id)}
      >
        <Ionicons 
          name={item.checked ? "checkmark-circle" : "ellipse-outline"} 
          size={24} 
          color={item.checked ? "#4ECDC4" : "#ccc"} 
        />
      </TouchableOpacity>
      
      <View style={styles.shoppingContent}>
        <Text style={[styles.shoppingName, item.checked && styles.shoppingNameChecked]}>
          {item.name}
        </Text>
        <Text style={styles.shoppingQuantity}>
          {item.quantity} {item.unit}
        </Text>
      </View>
      
      <View style={styles.shoppingActions}>
        <TouchableOpacity 
          style={styles.quantityButton}
          onPress={() => handleUpdateQuantity(item.id, item.quantity, -1)}
        >
          <Ionicons name="remove" size={16} color="#666" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quantityButton}
          onPress={() => handleUpdateQuantity(item.id, item.quantity, 1)}
        >
          <Ionicons name="add" size={16} color="#666" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteItem(item.id)}
        >
          <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* 탭 버튼 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'recipe' && styles.tabButtonActive]}
          onPress={() => setActiveTab('recipe')}
        >
          <Ionicons name="restaurant" size={20} color={activeTab === 'recipe' ? '#FF6B6B' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'recipe' && styles.tabTextActive]}>
            레시피 추천
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'shopping' && styles.tabButtonActive]}
          onPress={() => setActiveTab('shopping')}
        >
          <Ionicons name="cart" size={20} color={activeTab === 'shopping' ? '#4ECDC4' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'shopping' && styles.tabTextActive]}>
            장보기 리스트
          </Text>
        </TouchableOpacity>
      </View>

      {/* 레시피 추천 탭 */}
      {activeTab === 'recipe' && (
        <View style={styles.tabContent}>
          {/* 필터 버튼들 */}
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterButton, onlyFullMatch && styles.filterButtonActive]}
              onPress={() => setOnlyFullMatch(!onlyFullMatch)}
            >
              <Text style={[styles.filterButtonText, onlyFullMatch && styles.filterButtonTextActive]}>
                완전매칭
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.filterButton, maxMissing <= 1 && styles.filterButtonActive]}
              onPress={() => setMaxMissing(maxMissing <= 1 ? 99 : 1)}
            >
              <Text style={[styles.filterButtonText, maxMissing <= 1 && styles.filterButtonTextActive]}>
                부족≤1
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => { setOnlyFullMatch(false); setMaxMissing(99); }}
            >
              <Text style={styles.filterButtonText}>초기화</Text>
            </TouchableOpacity>
          </View>

          {/* 레시피 목록 */}
          {loading ? (
            <ActivityIndicator size="large" color="#FF6B6B" style={styles.loading} />
          ) : (
            <FlatList
              data={rankedRecipes}
              keyExtractor={(item) => item.id}
              renderItem={renderRecipeItem}
              scrollEnabled={false}
              style={styles.recipeList}
            />
          )}
        </View>
      )}

      {/* 장보기 리스트 탭 */}
      {activeTab === 'shopping' && (
        <View style={styles.tabContent}>
          {/* 새 항목 추가 */}
          <View style={styles.addItemContainer}>
            <TextInput
              style={styles.addItemInput}
              placeholder="새 항목 추가..."
              value={newItemName}
              onChangeText={setNewItemName}
              onSubmitEditing={handleAddItem}
            />
            <TouchableOpacity style={styles.addItemButton} onPress={handleAddItem}>
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* 장보기 목록 */}
          {shoppingLoading ? (
            <ActivityIndicator size="large" color="#4ECDC4" style={styles.loading} />
          ) : (
            <FlatList
              data={shoppingItems}
              keyExtractor={(item) => item.id}
              renderItem={renderShoppingItem}
              scrollEnabled={false}
              style={styles.shoppingList}
            />
          )}
        </View>
      )}

      {/* 앱 정보 */}
      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <Ionicons name="information-circle" size={20} color="#666" />
          <Text style={styles.infoText}>버전 1.0.0</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="heart" size={20} color="#666" />
          <Text style={styles.infoText}>Made with ❤️</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  tabButtonActive: {
    backgroundColor: '#f8f9fa',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#333',
  },
  tabContent: {
    marginTop: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  loading: {
    marginTop: 40,
  },
  recipeList: {
    marginHorizontal: 20,
  },
  recipeItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  recipeContent: {
    gap: 8,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  recipeInfo: {
    fontSize: 14,
    color: '#666',
  },
  recipeButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  recipeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  addItemContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  addItemInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  addItemButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  shoppingList: {
    marginHorizontal: 20,
  },
  shoppingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  shoppingCheckbox: {
    marginRight: 12,
  },
  shoppingContent: {
    flex: 1,
  },
  shoppingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  shoppingNameChecked: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  shoppingQuantity: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  shoppingActions: {
    flexDirection: 'row',
    gap: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
});
