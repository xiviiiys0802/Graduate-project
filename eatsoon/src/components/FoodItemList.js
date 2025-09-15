import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FlatList, View, Text, TouchableOpacity, Alert, ActivityIndicator, Modal, StyleSheet } from 'react-native';
import { Container, Title, Card, Button, ButtonText, EmptyContainer, EmptyText, LoadingContainer } from './StyledComponents';
import { 
  loadFoodItemsFromFirestore, 
  deleteFoodItemFromFirestore 
} from '../utils/firebaseStorage';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Dimensions } from 'react-native';
import { cancelFoodNotifications } from '../utils/notifications';
import { Colors, Theme } from '../utils/colors';
import { Ionicons } from '@expo/vector-icons';
import StatisticsService from '../services/statisticsService';
import SmoothSearchInput, { addGlobalSearchCallback } from './SmoothSearchInput';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FoodItemList = ({ onItemDeleted, refreshTrigger, initialFilter = null }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortType, setSortType] = useState('date'); // 'date', 'expiry', 'stock'
  const [searchQuery, setSearchQuery] = useState('');
  const [storageFilter, setStorageFilter] = useState('전체');
  const [isCompactView, setIsCompactView] = useState(false);
  const [isSortMenuVisible, setIsSortMenuVisible] = useState(false);
  const navigation = useNavigation();

  const { user } = useAuth();

  // initialFilter가 'expiring'일 때 유통기한 임박 필터 적용
  useEffect(() => {
    if (initialFilter === 'expiring') {
      setSortType('expiry');
    }
  }, [initialFilter]);

  const getCategoryKey = (category) => {
    const categoryMap = {
      '유제품': 'dairy',
      '육류': 'meat',
      '채소': 'vegetables',
      '과일': 'fruits',
      '곡물': 'grains',
      '음료': 'beverages',
      '간식': 'snacks',
    };
    return categoryMap[category] || 'others';
  };

  // 검색 및 보관 방법 필터링 함수 (부분 매칭 및 유추 지원)
  const filterItems = (items, query, storageType) => {
    let filtered = items;
    
    // 검색어 필터링 (부분 매칭 및 유추)
    if (query.trim()) {
      const searchTerm = query.toLowerCase().trim();
      
      // 정확한 매칭과 부분 매칭을 모두 지원
      filtered = filtered.filter(item => {
        const itemName = item.name.toLowerCase();
        const itemCategory = item.category ? item.category.toLowerCase() : '';
        
        // 1. 정확한 포함 검색
        if (itemName.includes(searchTerm) || itemCategory.includes(searchTerm)) {
          return true;
        }
        
        // 2. 부분 매칭 검색 (한글 자모 분해)
        if (isKoreanPartialMatch(itemName, searchTerm) || 
            isKoreanPartialMatch(itemCategory, searchTerm)) {
          return true;
        }
        
        // 3. 유추 검색 (첫 글자 매칭)
        if (itemName.startsWith(searchTerm) || itemCategory.startsWith(searchTerm)) {
          return true;
        }
        
        return false;
      });
      
      // 검색 결과를 관련도 순으로 정렬
      filtered = filtered.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const aCategory = a.category ? a.category.toLowerCase() : '';
        const bCategory = b.category ? b.category.toLowerCase() : '';
        
        // 정확한 매칭 우선
        const aExactMatch = aName.includes(searchTerm) || aCategory.includes(searchTerm);
        const bExactMatch = bName.includes(searchTerm) || bCategory.includes(searchTerm);
        
        if (aExactMatch && !bExactMatch) return -1;
        if (!aExactMatch && bExactMatch) return 1;
        
        // 첫 글자 매칭 우선
        const aStartsWith = aName.startsWith(searchTerm) || aCategory.startsWith(searchTerm);
        const bStartsWith = bName.startsWith(searchTerm) || bCategory.startsWith(searchTerm);
        
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        
        // 알파벳 순 정렬
        return aName.localeCompare(bName);
      });
    }
    
    // 보관 방법 필터링
    if (storageType !== '전체') {
      filtered = filtered.filter(item => item.storageType === storageType);
    }
    
    return filtered;
  };

  // 한글 부분 매칭 함수 (자모 분해)
  const isKoreanPartialMatch = (text, searchTerm) => {
    if (!text || !searchTerm) return false;
    
    // 간단한 한글 자모 분해 로직
    const decomposeKorean = (str) => {
      return str.split('').map(char => {
        const code = char.charCodeAt(0);
        if (code >= 0xAC00 && code <= 0xD7A3) {
          const base = code - 0xAC00;
          const initial = Math.floor(base / 588);
          const medial = Math.floor((base % 588) / 28);
          const final = base % 28;
          
          const initials = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
          const medials = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
          const finals = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
          
          return initials[initial] + medials[medial] + finals[final];
        }
        return char;
      }).join('');
    };
    
    const decomposedText = decomposeKorean(text);
    const decomposedSearch = decomposeKorean(searchTerm);
    
    return decomposedText.includes(decomposedSearch);
  };

  const handleAddPress = () => {
    navigation.navigate('AddFood');
  };


  const loadItems = async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const foodItems = await loadFoodItemsFromFirestore();
      setItems(foodItems);
    } catch (error) {
      console.error('음식 목록 불러오기 실패:', error);
      Alert.alert('오류', '음식 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [user, refreshTrigger]);

  // 전역 검색 상태 구독
  useEffect(() => {
    const unsubscribe = addGlobalSearchCallback((query) => {
      setSearchQuery(query);
    });
    return unsubscribe;
  }, []);

  // 검색어나 보관 방법 변경 시 필터링 및 정렬 적용 (useMemo로 최적화)
  const filteredItems = useMemo(() => {
    let filtered = filterItems(items, searchQuery, storageFilter);
    
    // 정렬 적용
    filtered = [...filtered].sort((a, b) => {
      switch (sortType) {
        case 'expiry':
          const aExpiry = new Date(a.expirationDate);
          const bExpiry = new Date(b.expirationDate);
          return aExpiry - bExpiry;
        case 'stock':
          // 재고 부족한 순 (수량 적은 순)
          return a.quantity - b.quantity;
        case 'date':
        default:
          // 등록순 (최신 등록 순)
          const aDate = new Date(a.createdAt);
          const bDate = new Date(b.createdAt);
          return bDate - aDate;
      }
    });
    
    return filtered;
  }, [searchQuery, storageFilter, items, sortType]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadItems();
  };

  const handleSortPress = () => {
    setIsSortMenuVisible(true);
  };

  const handleSortSelect = (type) => {
    setSortType(type);
    setIsSortMenuVisible(false);
  };

  const handleCompactViewToggle = () => {
    setIsCompactView(prev => !prev);
  };

  // 검색 핸들러 제거 (전역 상태 사용)

  const handleStorageFilterChange = (filter) => {
    setStorageFilter(filter);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleEdit = (item) => {
    // AddFoodScreen으로 이동 (수정 모드)
    navigation.navigate('AddFood', { 
      editMode: true, 
      itemToEdit: item 
    });
  };

  const handleDelete = async (itemId) => {
    Alert.alert(
      '삭제 확인',
      '이 음식 아이템을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFoodItemFromFirestore(itemId);
              
              // 통계 업데이트
              try {
                const itemToDelete = items.find(item => item.id === itemId);
                const categoryKey = getCategoryKey(itemToDelete?.category || 'others');
                await StatisticsService.removeFoodItem(categoryKey);
              } catch (statError) {
                console.error('통계 업데이트 실패:', statError);
              }
              
              // 관련 알림 취소
              try {
                await cancelFoodNotifications(itemId);
                console.log('음식 삭제 시 관련 알림이 취소되었습니다.');
              } catch (notificationError) {
                console.error('알림 취소 실패:', notificationError);
              }
              
              await loadItems();
              if (onItemDeleted) {
                onItemDeleted();
              }
            } catch (error) {
              Alert.alert('오류', '삭제에 실패했습니다: ' + error.message);
            }
          },
        },
      ]
    );
  };

  // 유통기한 상태 계산
  const getExpiryStatus = (expirationDate) => {
    const expiryDate = new Date(expirationDate);
    const now = new Date();
    const diffTime = expiryDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { status: 'expired', days: diffDays, color: Colors.danger };
    if (diffDays <= 1) return { status: 'urgent', days: diffDays, color: Colors.danger };
    if (diffDays <= 3) return { status: 'warning', days: diffDays, color: Colors.warning };
    return { status: 'safe', days: diffDays, color: Colors.success };
  };

  // 카테고리 아이콘 가져오기
  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case '채소': return 'leaf';
      case '과일': return 'nutrition';
      case '육류': return 'restaurant';
      case '유제품': return 'water';
      case '곡물': return 'grain';
      default: return 'fast-food';
    }
  };

  // 보관 방법 아이콘 가져오기
  const getStorageIcon = (storageType) => {
    switch (storageType) {
      case '냉장': return 'snow';
      case '냉동': return 'snow-outline';
      case '실온': return 'thermometer';
      default: return 'snow';
    }
  };

  // 보관 방법 색상 가져오기
  const getStorageColor = (storageType) => {
    switch (storageType) {
      case '냉장': return '#4A90E2';
      case '냉동': return '#7B68EE';
      case '실온': return '#FF8C00';
      default: return '#4A90E2';
    }
  };

  // 헤더 컴포넌트
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.searchContainer}>
        <TouchableOpacity 
          style={[styles.menuButton, isCompactView && styles.menuButtonActive]}
          onPress={handleCompactViewToggle}
        >
          <Ionicons 
            name={isCompactView ? "grid" : "grid-outline"} 
            size={24} 
            color={isCompactView ? "#fff" : "#333"} 
          />
        </TouchableOpacity>
        <View style={styles.searchInputContainer}>
          <SmoothSearchInput
            placeholder="음식명이나 카테고리로 검색..."
          />
        </View>
      </View>
      
      {/* 보관 방법 필터 */}
      <View style={styles.storageFilterSection}>
        <View style={styles.storageFilterButtons}>
          {['전체', '냉장', '냉동', '실온'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.storageFilterButton,
                storageFilter === type && styles.storageFilterButtonActive
              ]}
              onPress={() => handleStorageFilterChange(type)}
            >
              <Ionicons 
                name={type === '전체' ? 'grid' : getStorageIcon(type)} 
                size={16} 
                color={storageFilter === type ? Colors.textInverse : getStorageColor(type)} 
              />
              <Text style={[
                styles.storageFilterButtonText,
                storageFilter === type && styles.storageFilterButtonTextActive
              ]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <View style={styles.headerButtons}>
        <TouchableOpacity style={styles.addButton} onPress={handleAddPress}>
          <Ionicons name="add-circle" size={22} color={Colors.textInverse} />
          <Text style={styles.addButtonText}>재고 추가</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.sortButton, sortType !== 'date' && styles.sortButtonActive]} 
          onPress={handleSortPress}
        >
          <Ionicons 
            name={
              sortType === 'expiry' ? "calendar-outline" : 
              sortType === 'stock' ? "warning-outline" : 
              "list-outline"
            } 
            size={18} 
            color={sortType !== 'date' ? '#fff' : '#666'} 
          />
          <Text style={[styles.sortButtonText, sortType !== 'date' && styles.sortButtonTextActive]}>
            {sortType === 'expiry' ? "임박순" : 
             sortType === 'stock' ? "재고순" : 
             "등록순"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // 음식 아이템 카드
  const renderItem = ({ item }) => {
    const expiryStatus = getExpiryStatus(item.expirationDate);
    const isLowStock = item.quantity <= 2;
    
    if (isCompactView) {
      return (
        <View style={[styles.compactCard, { borderLeftColor: expiryStatus.color }]}>
          <View style={styles.compactContent}>
            <View style={styles.compactLeft}>
              <Ionicons 
                name={getCategoryIcon(item.category)} 
                size={16} 
                color="#4f62c0" 
              />
              <Text style={styles.compactName} numberOfLines={1}>{item.name}</Text>
            </View>
            <View style={styles.compactRight}>
              <Text style={styles.compactQuantity}>{item.quantity}개</Text>
              {isLowStock && (
                <Ionicons name="warning" size={14} color="#FF6B6B" />
              )}
            </View>
          </View>
        </View>
      );
    }
    
    return (
      <Card style={[styles.foodCard, { borderLeftColor: expiryStatus.color }]}>
        <View style={styles.cardHeader}>
          <View style={styles.foodInfo}>
            <View style={styles.foodTitleRow}>
              <View style={[styles.categoryIconContainer, { backgroundColor: Colors.background }]}>
                <Ionicons 
                  name={getCategoryIcon(item.category)} 
                  size={20} 
                  color={Colors.primary} 
                />
              </View>
              <View style={styles.foodNameContainer}>
                <Text style={styles.foodName}>{item.name}</Text>
                {isLowStock && (
                  <View style={styles.lowStockBadge}>
                    <Ionicons name="warning" size={12} color={Colors.textInverse} />
                    <Text style={styles.lowStockText}>재고부족</Text>
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.foodDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="cube-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.detailText}>수량: {item.quantity}개</Text>
              </View>
              
              {item.category && (
                <View style={styles.detailRow}>
                  <Ionicons name="pricetag-outline" size={16} color={Colors.textSecondary} />
                  <Text style={styles.detailText}>{item.category}</Text>
                </View>
              )}
              
              {item.storageType && (
                <View style={styles.detailRow}>
                  <Ionicons 
                    name={getStorageIcon(item.storageType)} 
                    size={16} 
                    color={getStorageColor(item.storageType)} 
                  />
                  <Text style={[styles.detailText, { color: getStorageColor(item.storageType) }]}>
                    {item.storageType}
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.editButton} 
              onPress={() => handleEdit(item)}
            >
              <Ionicons name="create-outline" size={22} color={Colors.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.deleteButton} 
              onPress={() => handleDelete(item.id)}
            >
              <Ionicons name="trash-outline" size={22} color={Colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.expirySection}>
          <View style={styles.expiryRow}>
            <Ionicons name="calendar-outline" size={18} color={expiryStatus.color} />
            <Text style={[styles.expiryText, { color: expiryStatus.color }]}>
              유통기한: {item.expirationDate}
            </Text>
          </View>
          
          <View style={[styles.expiryBadge, { backgroundColor: expiryStatus.color }]}>
            <Text style={styles.expiryBadgeText}>
              {expiryStatus.status === 'expired' ? '만료' : 
               expiryStatus.status === 'urgent' ? '오늘' : 
               expiryStatus.status === 'warning' ? `${expiryStatus.days}일` : 
               `${expiryStatus.days}일`}
            </Text>
          </View>
        </View>
        
        <View style={styles.cardFooter}>
          <Text style={styles.addedDate}>
            추가: {item.addedDate}
          </Text>
        </View>
      </Card>
    );
  };

  // 빈 상태 컴포넌트
  const renderEmptyComponent = () => {
    if (searchQuery.trim()) {
      return (
        <EmptyContainer>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="search-outline" size={80} color={Colors.textSecondary} />
          </View>
          <EmptyText>검색 결과가 없습니다</EmptyText>
          <Text style={styles.emptySubtext}>
            "{searchQuery}"에 대한 검색 결과를 찾을 수 없습니다.
          </Text>
          <TouchableOpacity style={styles.clearSearchButton} onPress={handleClearSearch}>
            <Text style={styles.clearSearchButtonText}>검색 초기화</Text>
          </TouchableOpacity>
        </EmptyContainer>
      );
    }
    
    return (
      <EmptyContainer>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="restaurant-outline" size={80} color={Colors.textSecondary} />
        </View>
        <EmptyText>냉장고가 비어있습니다</EmptyText>
        <Text style={styles.emptySubtext}>
          첫 번째 음식 재고를 추가하여 관리를 시작해보세요!
        </Text>
        <TouchableOpacity style={styles.addFirstButton} onPress={handleAddPress}>
          <Ionicons name="add-circle" size={20} color={Colors.textInverse} />
          <Text style={styles.addFirstButtonText}>첫 재고 추가하기</Text>
        </TouchableOpacity>
      </EmptyContainer>
    );
  };

  if (!user) {
    return (
      <Container>
        <Title>로그인이 필요합니다</Title>
      </Container>
    );
  }

  if (loading) {
    return (
      <LoadingContainer>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>음식을 불러오는 중...</Text>
      </LoadingContainer>
    );
  }

  // 정렬 메뉴 모달 렌더링
  const renderSortModal = () => (
    <Modal
      visible={isSortMenuVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setIsSortMenuVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.sortModal}>
          <View style={styles.sortHeader}>
            <Text style={styles.sortTitle}>정렬 방법</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setIsSortMenuVisible(false)}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.sortItems}>
            <TouchableOpacity 
              style={[styles.sortItem, sortType === 'date' && styles.sortItemActive]}
              onPress={() => handleSortSelect('date')}
            >
              <View style={styles.sortItemLeft}>
                <Ionicons name="list-outline" size={24} color={sortType === 'date' ? '#FF6B6B' : '#666'} />
                <Text style={[styles.sortItemText, sortType === 'date' && styles.sortItemTextActive]}>
                  등록순
                </Text>
              </View>
              {sortType === 'date' && <Ionicons name="checkmark" size={20} color="#FF6B6B" />}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.sortItem, sortType === 'expiry' && styles.sortItemActive]}
              onPress={() => handleSortSelect('expiry')}
            >
              <View style={styles.sortItemLeft}>
                <Ionicons name="calendar-outline" size={24} color={sortType === 'expiry' ? '#FF6B6B' : '#666'} />
                <Text style={[styles.sortItemText, sortType === 'expiry' && styles.sortItemTextActive]}>
                  임박순
                </Text>
              </View>
              {sortType === 'expiry' && <Ionicons name="checkmark" size={20} color="#FF6B6B" />}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.sortItem, sortType === 'stock' && styles.sortItemActive]}
              onPress={() => handleSortSelect('stock')}
            >
              <View style={styles.sortItemLeft}>
                <Ionicons name="warning-outline" size={24} color={sortType === 'stock' ? '#FF6B6B' : '#666'} />
                <Text style={[styles.sortItemText, sortType === 'stock' && styles.sortItemTextActive]}>
                  재고순
                </Text>
              </View>
              {sortType === 'stock' && <Ionicons name="checkmark" size={20} color="#FF6B6B" />}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <Container>
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        removeClippedSubviews={false}
      />
      {renderSortModal()}
    </Container>
  );
};

const styles = {
  header: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    gap: 16,
  },
  addButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    flex: 1,
    justifyContent: 'center',
    ...Theme.shadows.medium,
  },
  addButtonText: {
    color: Colors.textInverse,
    fontSize: Theme.typography.body.fontSize,
    fontWeight: '600',
    marginLeft: Theme.spacing.sm,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    minWidth: 100,
    justifyContent: 'center',
  },
  sortButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sortButtonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: '#fff',
  },
  listContainer: {
    flexGrow: 1,
    paddingHorizontal: Theme.spacing.md,
    paddingTop: Theme.spacing.sm,
  },
  foodCard: {
    marginBottom: 8,
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  foodInfo: {
    flex: 1,
  },
  foodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  categoryIconContainer: {
    width: 32,
    height: 32,
    borderRadius: Theme.borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.sm,
    ...Theme.shadows.small,
  },
  foodNameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  foodName: {
    fontSize: Theme.typography.h3.fontSize,
    fontWeight: Theme.typography.h3.fontWeight,
    color: Colors.textPrimary,
    flex: 1,
  },
  lowStockBadge: {
    backgroundColor: Colors.warning,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.round,
    marginLeft: Theme.spacing.sm,
  },
  lowStockText: {
    color: Colors.textInverse,
    fontSize: Theme.typography.small.fontSize,
    fontWeight: '600',
    marginLeft: Theme.spacing.xs,
  },
  foodDetails: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: Theme.typography.caption.fontSize,
    color: Colors.textSecondary,
    marginLeft: Theme.spacing.sm,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  editButton: {
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.round,
    backgroundColor: Colors.surface,
  },
  deleteButton: {
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.round,
    backgroundColor: Colors.surface,
  },
  expirySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
    paddingTop: Theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  expiryText: {
    fontSize: Theme.typography.caption.fontSize,
    fontWeight: '600',
    marginLeft: Theme.spacing.sm,
  },
  expiryBadge: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.round,
    ...Theme.shadows.small,
  },
  expiryBadgeText: {
    color: Colors.textInverse,
    fontSize: Theme.typography.small.fontSize,
    fontWeight: '700',
  },
  cardFooter: {
    paddingTop: Theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  addedDate: {
    fontSize: Theme.typography.small.fontSize,
    color: Colors.textDisabled,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingText: {
    marginTop: Theme.spacing.md,
    fontSize: Theme.typography.body.fontSize,
    color: Colors.textSecondary,
  },
  emptySubtext: {
    fontSize: Theme.typography.caption.fontSize,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Theme.spacing.sm,
    lineHeight: 20,
  },
  emptyIconContainer: {
    marginBottom: Theme.spacing.lg,
  },
  clearSearchButton: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Theme.spacing.lg,
  },
  clearSearchButtonText: {
    color: Colors.textPrimary,
    fontSize: Theme.typography.body.fontSize,
    fontWeight: '600',
    textAlign: 'center',
  },
  addFirstButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    marginTop: Theme.spacing.lg,
    ...Theme.shadows.medium,
  },
  addFirstButtonText: {
    color: Colors.textInverse,
    fontSize: Theme.typography.body.fontSize,
    fontWeight: '600',
    marginLeft: Theme.spacing.sm,
  },
  storageFilterSection: {
    marginTop: 4,
    marginBottom: 8,
  },
  storageFilterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Theme.spacing.xs,
  },
  storageFilterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  storageFilterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  storageFilterButtonText: {
    fontSize: Theme.typography.small.fontSize,
    color: Colors.textSecondary,
    marginLeft: Theme.spacing.xs,
    fontWeight: '500',
  },
  storageFilterButtonTextActive: {
    color: Colors.textInverse,
  },
  // 헤더 스타일
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  menuButton: {
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  menuButtonActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  searchInputContainer: {
    flex: 1,
  },
  // 메뉴 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    paddingTop: 60,
  },
  menuModal: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  menuItems: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginLeft: 16,
  },
  // 정렬 모달 스타일
  sortModal: {
    backgroundColor: '#fff',
    marginHorizontal: 40,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  sortHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sortTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  sortItems: {
    paddingVertical: 8,
  },
  sortItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sortItemActive: {
    backgroundColor: '#fff5f5',
  },
  sortItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginLeft: 16,
  },
  sortItemTextActive: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  // 컴팩트 뷰 스타일
  compactCard: {
    backgroundColor: '#fff',
    marginBottom: 4,
    borderLeftWidth: 3,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  compactRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  compactQuantity: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
};

export default FoodItemList;