// src/screens/MoreScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../config/firebase';
import { subscribePantry, fetchRecipesOnce, seedRecipesIfEmpty, dedupeRecipesByName } from '../services/firestore';
import { recommendRecipes } from '../utils/recommendation';
import { listAll, addItem, toggleCheck, updateItem, deleteItem } from '../utils/shoppingList';

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

    unsubAuth = auth.onAuthStateChanged(async (user) => {
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

  // 매칭 상태를 시각적으로 보여주는 컴포넌트 (간단 버전)
  const MatchingProgressMini = ({ matchCount, neededCount, missing }) => {
    const progress = neededCount > 0 ? matchCount / neededCount : 0;
    const progressPercentage = Math.round(progress * 100);
    
    return (
      <View style={styles.matchingMiniContainer}>
        {/* 프로그레스 바 */}
        <View style={styles.progressMiniContainer}>
          <View style={styles.progressMiniBar}>
            <View 
              style={[
                styles.progressMiniFill, 
                { width: `${progressPercentage}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressMiniText}>
            {matchCount}/{neededCount} ({progressPercentage}%)
          </Text>
        </View>
        
        {/* 재료 상태 표시 (간단 버전) */}
        <View style={styles.ingredientsMiniGrid}>
          {/* 보유한 재료들 */}
          {Array.from({ length: matchCount }, (_, index) => (
            <View key={`have-${index}`} style={styles.ingredientMiniHave}>
              <Text style={styles.ingredientMiniText}>✓</Text>
            </View>
          ))}
          {/* 부족한 재료들 */}
          {Array.from({ length: missing?.length || 0 }, (_, index) => (
            <View key={`missing-${index}`} style={styles.ingredientMiniMissing}>
              <Text style={styles.ingredientMiniText}>✗</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderRecipeItem = ({ item }) => (
    <View style={styles.recipeItem}>
      <View style={styles.recipeContent}>
        <Text style={styles.recipeTitle} numberOfLines={2}>
          {item.title || item.name}
        </Text>
        
        {/* 매칭 상태 시각화 */}
        <MatchingProgressMini 
          matchCount={item.matchCount}
          neededCount={item.neededCount}
          missing={item.missing}
        />
        
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
      <Text style={styles.sectionTitle}>기능</Text>

      <TouchableOpacity style={styles.recipeBox} onPress={() => navigation.navigate('RecipeRecommendation')}>
        <Text style={styles.recipeText}>레시피 추천</Text>
      </TouchableOpacity>

      <View style={styles.bottomRow}>
        <TouchableOpacity style={styles.leftBox} onPress={() => navigation.navigate('StatisticsReport')}>
          <Text>통계/리포트</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.rightBox} onPress={() => navigation.navigate('ShoppingList')}>
          <Text>장보기 리스트</Text>
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

      {/* 추가 기능 섹션 */}
      <View style={styles.menuContainer}>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('RecipeRecommendation')}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="restaurant-outline" size={24} color="#FF6B6B" />
            <Text style={styles.menuItemText}>전체 레시피 보기</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.menuItem, styles.menuItemLast]}
          onPress={() => navigation.navigate('ShoppingList')}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="cart-outline" size={24} color="#4ECDC4" />
            <Text style={styles.menuItemText}>장보기 리스트 관리</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

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
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginHorizontal: 16,
    marginTop: 24,
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
  matchingMiniContainer: {
    gap: 6,
  },
  progressMiniContainer: {
    gap: 4,
  },
  progressMiniBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressMiniFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  progressMiniText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  ingredientsMiniGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  ingredientMiniHave: {
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF5020',
    borderRadius: 3,
  },
  ingredientMiniMissing: {
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4433620',
    borderRadius: 3,
  },
  ingredientMiniText: {
    fontSize: 10,
    fontWeight: 'bold',
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
  menuContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginLeft: 12,
  },
  menuItemLast: {
    borderBottomWidth: 0,
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
  recipeBox: {
    height: 150,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: '#ffe0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeText: {
    fontSize: 18,
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  leftBox: {
    flex: 1,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#d0f0ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightBox: {
    flex: 1,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#d0ffd0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});