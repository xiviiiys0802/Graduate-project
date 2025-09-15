// src/screens/MoreScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../config/firebase';
import { subscribePantry, fetchRecipesOnce, seedRecipesIfEmpty, dedupeRecipesByName } from '../services/firestore';
import { recommendRecipes } from '../utils/recommendation';
import { addItem, toggleCheck, updateItem, deleteItem, listAll } from '../utils/shoppingList';

export default function MoreScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('recipe');
  const [loading, setLoading] = useState(true);
  const [pantry, setPantry] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [sortBy, setSortBy] = useState('all'); // 'all', 'expiring', 'available'
  const [shoppingItems, setShoppingItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [shoppingLoading, setShoppingLoading] = useState(true);
  const [shoppingSortBy, setShoppingSortBy] = useState('recent'); // 'recent', 'alphabetical'

  // 레시피 추천 데이터 로드
  useEffect(() => {
    let unsubAuth, unsubPantry;
    
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
      let sortedItems = [...items];
      
      // 체크 상태별 정렬 (체크된 항목은 아래로)
      sortedItems.sort((a, b) => {
        if (a.checked !== b.checked) {
          return a.checked ? 1 : -1;
        }
        return 0;
      });
      
      // 체크되지 않은 항목들만 추가 정렬
      const uncheckedItems = sortedItems.filter(item => !item.checked);
      const checkedItems = sortedItems.filter(item => item.checked);
      
      if (shoppingSortBy === 'alphabetical') {
        uncheckedItems.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      } else {
        uncheckedItems.sort((a, b) => {
          const aTime = a.updatedAt?.toDate?.() || new Date(0);
          const bTime = b.updatedAt?.toDate?.() || new Date(0);
          return bTime - aTime;
        });
      }
      
      setShoppingItems([...uncheckedItems, ...checkedItems]);
      setShoppingLoading(false);
    });

    return unsubscribe;
  }, [shoppingSortBy]);

  // 유통기한이 임박한 상품 찾기 (3일 이내)
  const expiringItems = React.useMemo(() => {
    if (loading) return [];
    const today = new Date();
    return pantry.filter(item => {
      const expiryDate = new Date(item.expirationDate);
      const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 3 && daysUntilExpiry >= 0;
    });
  }, [loading, pantry]);

  // 추천 레시피 계산
  const rankedRecipes = React.useMemo(() => {
    if (loading) return [];
    
    if (sortBy === 'all') {
      // 전체 레시피 (기본 추천)
      return recommendRecipes(recipes, pantry, {
        topK: 5,
        maxMissing: 99,
        onlyFullMatch: false,
      });
    } else if (sortBy === 'expiring') {
      // 유통기한 임박 상품을 활용하는 레시피
      const expiringItemNames = expiringItems.map(item => item.name.toLowerCase());
      
      return recipes
        .map(recipe => {
          const ingredients = recipe.ingredients || [];
          const needed = ingredients.map(it => (typeof it === 'string' ? { name: it } : it));
          
          // 유통기한 임박 재료와 매칭되는 개수 계산
          const matchingExpiring = needed.filter(ingredient => {
            const ingredientName = ingredient.name?.toLowerCase() || '';
            return expiringItemNames.some(expiringName => 
              ingredientName.includes(expiringName) || 
              expiringName.includes(ingredientName)
            );
          }).length;
          
          // 부족한 재료 계산 (유통기한 임박 재료가 아닌 것들)
          const missing = needed.filter(ingredient => {
            const ingredientName = ingredient.name?.toLowerCase() || '';
            // 유통기한 임박 재료가 아니고, 현재 냉장고에도 없는 재료
            const isNotExpiring = !expiringItemNames.some(expiringName => 
              ingredientName.includes(expiringName) || 
              expiringName.includes(ingredientName)
            );
            const isNotInPantry = !pantry.some(pantryItem => 
              pantryItem.name.toLowerCase().includes(ingredientName) ||
              ingredientName.includes(pantryItem.name.toLowerCase())
            );
            return isNotExpiring && isNotInPantry;
          }).map(ingredient => ({
            name: ingredient.name?.trim(),
            quantity: ingredient.quantity ?? 1,
            unit: ingredient.unit?.trim() || '개',
          }));
          
          return {
            ...recipe,
            expiringMatchCount: matchingExpiring,
            totalIngredients: ingredients.length,
            missing: missing,
            matchCount: matchingExpiring,
            neededCount: needed.length
          };
        })
        .filter(recipe => recipe.expiringMatchCount > 0)
        .sort((a, b) => b.expiringMatchCount - a.expiringMatchCount)
        .slice(0, 5);
    } else {
      // 현재 재료로 만들 수 있는 레시피 (3분의 2 이상 매칭)
      return recommendRecipes(recipes, pantry, {
        topK: 10,
        maxMissing: 99,
        onlyFullMatch: false,
      }).filter(recipe => {
        const matchRatio = recipe.matchCount / recipe.neededCount;
        return matchRatio >= 2/3; // 3분의 2 이상 매칭
      }).slice(0, 5);
    }
  }, [loading, recipes, pantry, sortBy, expiringItems]);

  // 장보기 리스트 추가 (중복 체크 및 수량 증가)
  const handleAddItem = async () => {
    if (!newItemName.trim()) return;
    
    const itemName = newItemName.trim();
    
    try {
      // 기존 항목이 있는지 확인
      const existingItem = shoppingItems.find(item => 
        item.name.toLowerCase() === itemName.toLowerCase()
      );
      
      if (existingItem) {
        // 기존 항목이 있으면 수량 증가
        await updateItem(existingItem.id, { 
          quantity: existingItem.quantity + 1 
        });
        Alert.alert('완료', `${itemName}의 수량이 증가했습니다.`);
      } else {
        // 새 항목 추가
        await addItem(itemName, 1, '개');
        Alert.alert('완료', `${itemName}이 장보기 리스트에 추가되었습니다.`);
      }
      
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
      Alert.alert('오류', '체크 상태 변경에 실패했습니다.');
    }
  };

  // 장보기 리스트 수량 변경
  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      await handleDeleteItem(itemId);
      return;
    }
    
    try {
      await updateItem(itemId, { quantity: newQuantity });
    } catch (error) {
      Alert.alert('오류', '수량 변경에 실패했습니다.');
    }
  };

  // 장보기 리스트 항목 삭제
  const handleDeleteItem = async (itemId) => {
    try {
      await deleteItem(itemId);
    } catch (error) {
      Alert.alert('오류', '항목 삭제에 실패했습니다.');
    }
  };

  // 전체 선택/해제
  const handleSelectAll = async () => {
    const allChecked = shoppingItems.every(item => item.checked);
    const allUnchecked = shoppingItems.every(item => !item.checked);
    
    if (allChecked) {
      // 모두 체크되어 있으면 모두 해제
      for (const item of shoppingItems) {
        if (item.checked) {
          await toggleCheck(item.id);
        }
      }
    } else if (allUnchecked) {
      // 모두 체크 해제되어 있으면 모두 선택
      for (const item of shoppingItems) {
        if (!item.checked) {
          await toggleCheck(item.id);
        }
      }
    } else {
      // 일부만 체크되어 있으면 모두 선택
      for (const item of shoppingItems) {
        if (!item.checked) {
          await toggleCheck(item.id);
        }
      }
    }
  };

  // 체크된 항목들 전체 삭제
  const handleDeleteChecked = () => {
    const checkedItems = shoppingItems.filter(item => item.checked);
    
    if (checkedItems.length === 0) {
      Alert.alert('알림', '삭제할 항목이 없습니다.');
      return;
    }

    Alert.alert(
      '전체 삭제 확인',
      `선택된 ${checkedItems.length}개 항목을 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              for (const item of checkedItems) {
                await deleteItem(item.id);
              }
            } catch (error) {
              Alert.alert('오류', '일부 항목 삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  // 부족한 재료를 장보기 리스트에 추가
  const handleAddMissingIngredients = async (recipe) => {
    // missing 배열이 없으면 빈 배열로 초기화
    const missingIngredients = recipe.missing || [];
    
    if (missingIngredients.length === 0) {
      Alert.alert('알림', '부족한 재료가 없습니다.');
      return;
    }

    try {
      let addedCount = 0;
      
      for (const ingredient of missingIngredients) {
        // ingredient가 객체인 경우 name 속성 사용, 문자열인 경우 그대로 사용
        const ingredientName = typeof ingredient === 'string' ? ingredient : ingredient.name;
        const ingredientQuantity = typeof ingredient === 'object' ? (ingredient.quantity || 1) : 1;
        const ingredientUnit = typeof ingredient === 'object' ? (ingredient.unit || '개') : '개';
        
        if (!ingredientName) continue;
        
        // 기존 항목이 있는지 확인
        const existingItem = shoppingItems.find(item => 
          item.name.toLowerCase() === ingredientName.toLowerCase()
        );
        
        if (existingItem) {
          // 기존 항목이 있으면 수량 증가
          await updateItem(existingItem.id, { 
            quantity: existingItem.quantity + ingredientQuantity 
          });
        } else {
          // 새 항목 추가
          await addItem(ingredientName, ingredientQuantity, ingredientUnit);
        }
        addedCount++;
      }
      
      Alert.alert('완료', `${addedCount}개 재료가 장보기 리스트에 추가되었습니다.`);
    } catch (error) {
      console.error('재료 추가 오류:', error);
      Alert.alert('오류', '재료 추가에 실패했습니다.');
    }
  };

  const renderRecipeItem = ({ item }) => (
    <View style={styles.recipeItem}>
      <View style={styles.recipeContent}>
        <Text style={styles.recipeTitle}>
          {item.title || item.name}
        </Text>
        <Text style={styles.recipeInfo}>
          {sortBy === 'expiring' 
            ? `유통기한 임박 재료 ${item.expiringMatchCount}개 활용`
            : `매칭 ${item.matchCount}/${item.neededCount} · 부족 ${item.missing.length}개`
          }
        </Text>
        <View style={styles.recipeButtons}>
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
          
          {(item.missing && item.missing.length > 0) && (
            <TouchableOpacity 
              style={styles.addToShoppingButton}
              onPress={() => handleAddMissingIngredients(item)}
            >
              <Ionicons name="cart" size={16} color="#4ECDC4" />
              <Text style={styles.addToShoppingButtonText}>장보기 추가</Text>
            </TouchableOpacity>
          )}
        </View>
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
          onPress={() => handleQuantityChange(item.id, item.quantity - 1)}
        >
          <Ionicons name="remove" size={16} color="#666" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quantityButton}
          onPress={() => handleQuantityChange(item.id, item.quantity + 1)}
        >
          <Ionicons name="add" size={16} color="#666" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteItem(item.id)}
        >
          <Ionicons name="trash" size={16} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
      </View>
      
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

      {activeTab === 'recipe' && (
        <View style={styles.tabContent}>
          {/* 정렬 버튼들 */}
          <View style={styles.sortContainer}>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'all' && styles.sortButtonActive]}
              onPress={() => setSortBy('all')}
            >
              <Ionicons 
                name="list" 
                size={16} 
                color={sortBy === 'all' ? '#fff' : '#666'} 
              />
              <Text style={[styles.sortButtonText, sortBy === 'all' && styles.sortButtonTextActive]}>
                전체
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'expiring' && styles.sortButtonActive]}
              onPress={() => setSortBy('expiring')}
            >
              <Ionicons 
                name="time" 
                size={16} 
                color={sortBy === 'expiring' ? '#fff' : '#666'} 
              />
              <Text style={[styles.sortButtonText, sortBy === 'expiring' && styles.sortButtonTextActive]}>
                유통기한 임박
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'available' && styles.sortButtonActive]}
              onPress={() => setSortBy('available')}
            >
              <Ionicons 
                name="checkmark-circle" 
                size={16} 
                color={sortBy === 'available' ? '#fff' : '#666'} 
              />
              <Text style={[styles.sortButtonText, sortBy === 'available' && styles.sortButtonTextActive]}>
                현재 재료로
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#FF6B6B" style={styles.loading} />
          ) : (
            <FlatList
              data={rankedRecipes}
              renderItem={renderRecipeItem}
              keyExtractor={(item) => item.id}
              style={styles.recipeList}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>추천할 레시피가 없습니다.</Text>
                </View>
              }
            />
          )}
        </View>
      )}

      {activeTab === 'shopping' && (
        <View style={styles.tabContent}>
          {/* 항목 추가 */}
          <View style={styles.addItemContainer}>
            <TextInput
              style={styles.addItemInput}
              placeholder="장보기 항목 추가..."
              value={newItemName}
              onChangeText={setNewItemName}
              onSubmitEditing={handleAddItem}
            />
            <TouchableOpacity style={styles.addItemButton} onPress={handleAddItem}>
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* 액션 버튼들 */}
          <View style={styles.shoppingActionsContainer}>
            <View style={styles.shoppingActionButtons}>
              <TouchableOpacity 
                style={styles.shoppingActionButton}
                onPress={handleSelectAll}
              >
                <Ionicons name="checkmark-done" size={16} color="#4ECDC4" />
                <Text style={styles.shoppingActionButtonText}>전체 선택</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.shoppingActionButton, styles.deleteActionButton]}
                onPress={handleDeleteChecked}
              >
                <Ionicons name="trash" size={16} color="#FF6B6B" />
                <Text style={[styles.shoppingActionButtonText, styles.deleteActionButtonText]}>선택 삭제</Text>
              </TouchableOpacity>
            </View>
            
            {/* 정렬 버튼 */}
            <View style={styles.sortButtonsContainer}>
              <TouchableOpacity 
                style={[styles.sortButton, shoppingSortBy === 'recent' && styles.sortButtonActive]}
                onPress={() => setShoppingSortBy('recent')}
              >
                <Ionicons name="time" size={14} color={shoppingSortBy === 'recent' ? '#fff' : '#666'} />
                <Text style={[styles.sortButtonText, shoppingSortBy === 'recent' && styles.sortButtonTextActive]}>
                  최근순
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.sortButton, shoppingSortBy === 'alphabetical' && styles.sortButtonActive]}
                onPress={() => setShoppingSortBy('alphabetical')}
              >
                <Ionicons name="text" size={14} color={shoppingSortBy === 'alphabetical' ? '#fff' : '#666'} />
                <Text style={[styles.sortButtonText, shoppingSortBy === 'alphabetical' && styles.sortButtonTextActive]}>
                  가나다순
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 장보기 목록 */}
          {shoppingLoading ? (
            <ActivityIndicator size="large" color="#4ECDC4" style={styles.loading} />
          ) : (
            <FlatList
              data={shoppingItems}
              renderItem={renderShoppingItem}
              keyExtractor={(item) => item.id}
              style={styles.shoppingList}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>장보기 리스트가 비어있습니다.</Text>
                </View>
              }
            />
          )}
        </View>
      )}

      {/* 앱 정보 */}
      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <Ionicons name="information-circle-outline" size={16} color="#666" />
          <Text style={styles.infoText}>EatSoon v1.0.0</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="person-outline" size={16} color="#666" />
          <Text style={styles.infoText}>개발자: EatSoon Team</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  topSpacing: {
    height: 20,
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
  sortContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 4,
  },
  sortButtonActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  sortButtonTextActive: {
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
  recipeButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  recipeButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
  },
  recipeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  addToShoppingButton: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addToShoppingButtonText: {
    color: '#4ECDC4',
    fontSize: 12,
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
  shoppingActionsContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  shoppingActionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  shoppingActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 4,
  },
  deleteActionButton: {
    backgroundColor: '#fff5f5',
    borderColor: '#FF6B6B',
  },
  shoppingActionButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  deleteActionButtonText: {
    color: '#FF6B6B',
  },
  sortButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
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
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
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