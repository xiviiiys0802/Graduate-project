// src/screens/MoreScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../config/firebase';
import { subscribePantry, fetchRecipesOnce, seedRecipesIfEmpty, dedupeRecipesByName } from '../services/firestore';
import { recommendRecipes, searchRecipes } from '../utils/recommendation';
import { addItem, toggleCheck, updateItem, deleteItem, listAll, markAllChecked, deleteAllChecked } from '../utils/shoppingList';

export default function MoreScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('recipe');
  const [loading, setLoading] = useState(true);
  const [pantry, setPantry] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [sortBy, setSortBy] = useState('all'); // 'all', 'expiring', 'available'
  const [searchQuery, setSearchQuery] = useState('');
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
      // seedRecipesIfEmpty() 제거 - Firebase에 이미 크롤링된 레시피만 있음
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
    
    let filteredRecipes = recipes;
    
    // 검색 기능
    if (searchQuery.trim()) {
      filteredRecipes = searchRecipes(recipes, searchQuery);
    }
    
    if (sortBy === 'all') {
      // 전체 레시피 (기본 추천)
      return recommendRecipes(filteredRecipes, pantry, {
        topK: 30,
        maxMissing: 99,
        onlyFullMatch: false,
      });
    } else if (sortBy === 'expiring') {
      // 유통기한 임박 재료로 만들 수 있는 레시피
      if (expiringItems.length === 0) return [];
      
      const expiringNames = expiringItems.map(item => 
        item.normalizedName || item.name || ''
      ).filter(name => name.trim() !== '');
      
      return filteredRecipes.filter(recipe => {
        const ingredients = recipe.ingredients || [];
        return ingredients.some(ing => {
          const ingredientName = (typeof ing === 'string' ? ing : ing.name || '').toLowerCase();
          return expiringNames.some(expiringName => 
            ingredientName.includes(expiringName.toLowerCase()) || 
            expiringName.toLowerCase().includes(ingredientName)
          );
        });
      }).map(recipe => {
        // 매칭된 임박 재료 개수 계산
        const ingredients = recipe.ingredients || [];
        const matchedExpiring = ingredients.filter(ing => {
          const ingredientName = (typeof ing === 'string' ? ing : ing.name || '').toLowerCase();
          return expiringNames.some(expiringName => 
            ingredientName.includes(expiringName.toLowerCase()) || 
            expiringName.toLowerCase().includes(ingredientName)
          );
        }).length;
        
        return {
          ...recipe,
          expiringMatchCount: matchedExpiring,
          ...recommendRecipes([recipe], pantry, { topK: 1, maxMissing: 99, onlyFullMatch: false })[0]
        };
      }).sort((a, b) => b.expiringMatchCount - a.expiringMatchCount);
    } else {
      // 현재 재료로 만들 수 있는 레시피 (3분의 2 이상 매칭)
      return recommendRecipes(filteredRecipes, pantry, {
        topK: 30,
        maxMissing: 99,
        onlyFullMatch: false,
      }).filter(recipe => {
        const matchRatio = recipe.matchCount / recipe.neededCount;
        return matchRatio >= 2/3; // 3분의 2 이상 매칭
      });
    }
  }, [loading, recipes, pantry, sortBy, expiringItems, searchQuery]);

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
      Alert.alert('오류', '항목 상태 변경에 실패했습니다.');
    }
  };

  // 고기류 재료 식별 함수
  const isMeatItem = (item) => {
    const meatKeywords = [
      '소고기', '돼지고기', '닭고기', '양고기', '오리고기', '쇠고기',
      '삼겹살', '목살', '갈비', '등심', '안심', '우둔', '사태', '양지',
      '닭가슴살', '닭다리', '닭봉', '닭날개', '닭안심',
      '돼지갈비', '돼지등갈비', '돼지목살', '돼지안심', '돼지갈비살',
      '베이컨', '햄', '소시지', '살라미',
      '고기', '육류', '정육'
    ];
    const itemName = (item.name || '').toLowerCase();
    return meatKeywords.some(keyword => itemName.includes(keyword));
  };

  // 장보기 리스트 수량 변경
  const handleQuantityChange = async (itemId, delta) => {
    const item = shoppingItems.find(item => item.id === itemId);
    if (!item) return;

    let newQuantity;
    if (isMeatItem(item) && item.unit === 'g') {
      // 고기류는 50g 단위로 조절
      newQuantity = Math.max(50, item.quantity + (delta * 50));
    } else {
      // 일반 재료는 1개 단위로 조절
      newQuantity = Math.max(1, item.quantity + delta);
    }

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
    const item = shoppingItems.find(item => item.id === itemId);
    const itemName = item?.name || '항목';
    
    Alert.alert(
      '삭제 확인',
      `"${itemName}"을(를) 정말 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteItem(itemId);
            } catch (error) {
              Alert.alert('오류', '항목 삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  // 장보기 리스트 렌더링
  const renderShoppingItem = ({ item }) => (
    <View style={styles.shoppingItem}>
      <TouchableOpacity 
        style={styles.checkbox}
        onPress={() => handleToggleCheck(item.id)}
      >
        <Ionicons 
          name={item.checked ? "checkmark-circle" : "ellipse-outline"} 
          size={24} 
          color={item.checked ? "#4ECDC4" : "#ccc"} 
        />
      </TouchableOpacity>
      
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, item.checked && styles.checkedItemName]}>
          {item.name}
        </Text>
        <Text style={styles.itemQuantity}>
          {item.quantity}{item.unit || '개'}
        </Text>
      </View>
      
      <View style={styles.itemActions}>
        <TouchableOpacity 
          style={styles.quantityButton}
          onPress={() => handleQuantityChange(item.id, -1)}
        >
          <Ionicons name="remove" size={16} color="#666" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quantityButton}
          onPress={() => handleQuantityChange(item.id, 1)}
        >
          <Ionicons name="add" size={16} color="#666" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteItem(item.id)}
        >
          <Text style={styles.deleteButtonText}>×</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4ECDC4" />
        <Text style={styles.loadingText}>로딩 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>더보기</Text>
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
          {/* 검색창 */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="된장찌개, 김치 등 검색"
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#666"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>
          </View>

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

          {/* 레시피 리스트 */}
          <ScrollView style={styles.recipeList} showsVerticalScrollIndicator={false}>
            {rankedRecipes.map((recipe, index) => (
              <View key={recipe.id || index} style={styles.recipeCard}>
                {/* 이미지 숨김: 제목/매칭/버튼만 표시 */}
                <View style={styles.recipeContent}>
                  <Text style={styles.recipeTitle}>{recipe.name}</Text>
                  <Text style={styles.recipeMatch}>
                    매칭 {recipe.matchCount}/{recipe.neededCount} · 부족 {recipe.missing?.length || 0}개
                  </Text>
                  
                  <View style={styles.recipeActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => {
                        const safe = {
                          id: recipe.id,
                          name: recipe.name,
                          imageUrl: recipe.imageUrl,
                          ingredients: recipe.ingredients,
                          steps: recipe.steps,
                        };
                        navigation.navigate('RecipeDetail', { recipe: safe });
                      }}
                    >
                      <Ionicons name="eye" size={16} color="#fff" />
                      <Text style={styles.actionButtonText}>자세히 보기</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.actionButton, styles.shoppingButton]}
                      onPress={async () => {
                        if (recipe.missing && recipe.missing.length > 0) {
                          // 각 부족한 재료를 개별 항목으로 추가
                          for (const item of recipe.missing) {
                            await addItem(item.name, 1, item.unit || '개');
                          }
                          Alert.alert('완료', `${recipe.missing.length}개 재료가 장보기 리스트에 추가되었습니다.`);
                        } else {
                          Alert.alert('알림', '부족한 재료가 없습니다.');
                        }
                      }}
                    >
                      <Ionicons name="cart" size={16} color="#fff" />
                      <Text style={styles.actionButtonText}>장보기 추가</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
            
            {rankedRecipes.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="restaurant-outline" size={64} color="#ccc" />
                <Text style={styles.emptyTitle}>조건에 맞는 레시피가 없습니다</Text>
                <Text style={styles.emptySubtitle}>필터를 조정해보세요</Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}

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
            <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
              <Text style={styles.addButtonText}>추가</Text>
            </TouchableOpacity>
          </View>

          {/* 정렬 옵션 */}
          <View style={styles.sortOptions}>
            <TouchableOpacity
              style={[styles.sortOption, shoppingSortBy === 'recent' && styles.sortOptionActive]}
              onPress={() => setShoppingSortBy('recent')}
            >
              <Text style={[styles.sortOptionText, shoppingSortBy === 'recent' && styles.sortOptionTextActive]}>
                최근순
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortOption, shoppingSortBy === 'alphabetical' && styles.sortOptionActive]}
              onPress={() => setShoppingSortBy('alphabetical')}
            >
              <Text style={[styles.sortOptionText, shoppingSortBy === 'alphabetical' && styles.sortOptionTextActive]}>
                가나다순
              </Text>
            </TouchableOpacity>
          </View>

          {/* 모두 선택/삭제 버튼 */}
          <View style={styles.bulkActions}>
            <TouchableOpacity
              style={styles.bulkActionButton}
              onPress={async () => {
                Alert.alert(
                  '모두 구매완료',
                  '모든 항목을 구매완료로 표시하시겠습니까?',
                  [
                    { text: '취소', style: 'cancel' },
                    {
                      text: '확인',
                      onPress: async () => {
                        try {
                          await markAllChecked();
                          Alert.alert('완료', '모든 항목이 구매완료로 표시되었습니다.');
                        } catch (error) {
                          Alert.alert('오류', '작업에 실패했습니다.');
                        }
                      },
                    },
                  ]
                );
              }}
            >
              <Text style={styles.bulkActionButtonText}>모두 구매완료</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.bulkActionButton, styles.deleteButton]}
              onPress={async () => {
                const checkedCount = shoppingItems.filter(item => item.checked).length;
                if (checkedCount === 0) {
                  Alert.alert('알림', '구매완료된 항목이 없습니다.');
                  return;
                }
                
                Alert.alert(
                  '구매완료 항목 삭제',
                  `구매완료된 ${checkedCount}개 항목을 삭제하시겠습니까?`,
                  [
                    { text: '취소', style: 'cancel' },
                    {
                      text: '삭제',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await deleteAllChecked();
                          Alert.alert('완료', `${checkedCount}개 항목이 삭제되었습니다.`);
                        } catch (error) {
                          Alert.alert('오류', '삭제에 실패했습니다.');
                        }
                      },
                    },
                  ]
                );
              }}
            >
              <Text style={styles.bulkActionButtonText}>체크삭제</Text>
            </TouchableOpacity>
          </View>

          {/* 장보기 리스트 */}
          {shoppingLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4ECDC4" />
            </View>
          ) : (
            <FlatList
              data={shoppingItems}
              keyExtractor={(item) => item.id}
              renderItem={renderShoppingItem}
              style={styles.shoppingList}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="cart-outline" size={64} color="#ccc" />
                  <Text style={styles.emptyTitle}>장보기 항목이 없습니다</Text>
                  <Text style={styles.emptySubtitle}>위에서 새 항목을 추가해보세요</Text>
                </View>
              }
            />
          )}
        </View>
      )}

          {/* 레시피 출처 - 레시피 추천 탭에서만 표시 */}
          {activeTab === 'recipe' && (
            <View style={styles.appInfo}>
              <Text style={styles.appInfoText}>레시피 출처: 만개의 레시피</Text>
            </View>
          )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#f8f9fa',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
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
    shadowRadius: 4,
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#f8f9fa',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#333',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  searchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    marginLeft: 12,
  },
  sortContainer: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 16,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sortButtonActive: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  sortButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  sortButtonTextActive: {
    color: '#fff',
  },
  recipeList: {
    flex: 1,
  },
  recipeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  // 이미지 숨김으로 스타일 제거
  recipeContent: {
    flex: 1,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  recipeMatch: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  recipeActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FF6B6B',
    marginHorizontal: 4,
  },
  shoppingButton: {
    backgroundColor: '#4ECDC4',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  addItemContainer: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 16,
  },
  addItemInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 12,
  },
  addButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sortOptions: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  sortOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sortOptionActive: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  sortOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  sortOptionTextActive: {
    color: '#fff',
  },
  shoppingList: {
    flex: 1,
  },
  shoppingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  checkbox: {
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  checkedItemName: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 16,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  appInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  updateButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  bulkActions: {
    flexDirection: 'row',
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  bulkActionButton: {
    flex: 1,
    backgroundColor: '#4ECDC4',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  bulkActionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
  },
});