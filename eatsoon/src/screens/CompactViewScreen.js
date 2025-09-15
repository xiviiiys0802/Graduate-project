<<<<<<< HEAD
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Container, Title } from '../components/StyledComponents';

const CompactViewScreen = () => {
  return (
    <Container>
      <Title>Compact View Screen</Title>
      <Text style={styles.text}>This is the compact view for your food items.</Text>
=======
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FlatList, View, Text, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Container, Card } from '../components/StyledComponents';
import { 
  loadFoodItemsFromFirestore, 
  deleteFoodItemFromFirestore 
} from '../utils/firebaseStorage';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { cancelFoodNotifications } from '../utils/notifications';
import { Colors, Theme } from '../utils/colors';
import { Ionicons } from '@expo/vector-icons';
import StatisticsService from '../services/statisticsService';
import SmoothSearchInput, { addGlobalSearchCallback } from '../components/SmoothSearchInput';

const CompactViewScreen = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSortedByExpiry, setIsSortedByExpiry] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [storageFilter, setStorageFilter] = useState('전체');
  const navigation = useNavigation();

  const { user } = useAuth();

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

  // 유통기한 임박순 정렬 함수
  const sortByExpiry = (list) => {
    return [...list].sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));
  };

  const loadItems = async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const foodItems = await loadFoodItemsFromFirestore();
      const sorted = isSortedByExpiry ? sortByExpiry(foodItems) : foodItems;
      setItems(sorted);
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
  }, [user, isSortedByExpiry]);

  // 전역 검색 상태 구독
  useEffect(() => {
    const unsubscribe = addGlobalSearchCallback((query) => {
      setSearchQuery(query);
    });
    return unsubscribe;
  }, []);

  // 검색어나 보관 방법 변경 시 필터링 적용 (useMemo로 최적화)
  const filteredItems = useMemo(() => {
    return filterItems(items, searchQuery, storageFilter);
  }, [searchQuery, storageFilter, items]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadItems();
  };

  const handleToggleSort = () => {
    setIsSortedByExpiry(prev => !prev);
  };

  // 검색 핸들러 제거 (전역 상태 사용)

  const handleStorageFilterChange = (filter) => {
    setStorageFilter(filter);
  };

  const handleEdit = (item) => {
    // AddFoodScreen으로 이동 (수정 모드)
    navigation.navigate('AddFood', { 
      editMode: true, 
      itemToEdit: item 
    });
  };

  const handleItemLongPress = (item) => {
    Alert.alert(
      '옵션 선택',
      `${item.name}에 대해 수행할 작업을 선택하세요.`,
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '수정', 
          onPress: () => handleEdit(item) 
        },
        { 
          text: '삭제', 
          style: 'destructive',
          onPress: () => handleDelete(item.id) 
        },
      ]
    );
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
      <SmoothSearchInput
        placeholder="음식명이나 카테고리로 검색..."
      />
      
      {/* 보관 방법 필터 */}
      <View style={styles.storageFilterSection}>
        <Text style={styles.storageFilterLabel}>보관 방법</Text>
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
                size={14} 
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
        <TouchableOpacity 
          style={[styles.sortButton, isSortedByExpiry && styles.sortButtonActive]} 
          onPress={handleToggleSort}
        >
          <Ionicons 
            name={isSortedByExpiry ? "calendar-outline" : "list-outline"} 
            size={16} 
            color={isSortedByExpiry ? Colors.textInverse : Colors.textSecondary} 
          />
          <Text style={[styles.sortButtonText, isSortedByExpiry && styles.sortButtonTextActive]}>
            {isSortedByExpiry ? "임박순" : "등록순"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // 컴팩트 음식 아이템 카드
  const renderItem = ({ item }) => {
    const expiryStatus = getExpiryStatus(item.expirationDate);
    const isLowStock = item.quantity <= 2;
    
    return (
      <TouchableOpacity 
        style={[styles.compactCard, { borderLeftColor: expiryStatus.color }]}
        onLongPress={() => handleItemLongPress(item)}
      >
        <View style={styles.compactCardContent}>
          <View style={styles.compactCardLeft}>
            <View style={styles.compactCardHeader}>
              <Text style={styles.compactFoodName} numberOfLines={1}>
                {item.name}
              </Text>
              {isLowStock && (
                <View style={styles.compactLowStockBadge}>
                  <Text style={styles.compactLowStockText}>부족</Text>
                </View>
              )}
            </View>
            
            <View style={styles.compactCardDetails}>
              <Text style={styles.compactDetailText}>
                {item.quantity}개
              </Text>
              {item.storageType && (
                <View style={styles.compactStorageInfo}>
                  <Ionicons 
                    name={getStorageIcon(item.storageType)} 
                    size={12} 
                    color={getStorageColor(item.storageType)} 
                  />
                  <Text style={[styles.compactDetailText, { color: getStorageColor(item.storageType) }]}>
                    {item.storageType}
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.compactCardRight}>
            <View style={[styles.compactExpiryBadge, { backgroundColor: expiryStatus.color }]}>
              <Text style={styles.compactExpiryBadgeText}>
                {expiryStatus.status === 'expired' ? '만료' : 
                 expiryStatus.status === 'urgent' ? '오늘' : 
                 expiryStatus.status === 'warning' ? `${expiryStatus.days}일` : 
                 `${expiryStatus.days}일`}
              </Text>
            </View>
            <Text style={styles.compactExpiryDate}>
              {item.expirationDate}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // 빈 상태 컴포넌트
  const renderEmptyComponent = () => {
    if (searchQuery.trim()) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={48} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>검색 결과가 없습니다</Text>
          <Text style={styles.emptySubtext}>
            "{searchQuery}"에 대한 검색 결과를 찾을 수 없습니다.
          </Text>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="restaurant-outline" size={48} color={Colors.textSecondary} />
        <Text style={styles.emptyText}>등록된 음식이 없습니다</Text>
        <Text style={styles.emptySubtext}>
          재고를 추가하여 음식 관리를 시작해보세요!
        </Text>
      </View>
    );
  };

  if (!user) {
    return (
      <Container>
        <Text style={styles.title}>로그인이 필요합니다</Text>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>음식을 불러오는 중...</Text>
        </View>
      </Container>
    );
  }

  return (
    <Container>
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        removeClippedSubviews={false}
        numColumns={1}
      />
>>>>>>> c80437fa78717037afb478adf4ee109291017435
    </Container>
  );
};

<<<<<<< HEAD
const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    color: '#333',
    marginTop: 10,
  },
});

export default CompactViewScreen;
=======
const styles = {
  header: {
    paddingHorizontal: Theme.spacing.md,
    paddingTop: Theme.spacing.sm,
    paddingBottom: Theme.spacing.sm,
    backgroundColor: Colors.background,
  },
  storageFilterSection: {
    marginTop: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  storageFilterLabel: {
    fontSize: Theme.typography.small.fontSize,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.xs,
    textAlign: 'center',
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
    paddingVertical: Theme.spacing.xs,
    paddingHorizontal: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.sm,
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
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: Theme.spacing.xs,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  sortButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sortButtonText: {
    fontSize: Theme.typography.small.fontSize,
    color: Colors.textSecondary,
    marginLeft: Theme.spacing.xs,
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: Colors.textInverse,
  },
  listContainer: {
    flexGrow: 1,
    paddingHorizontal: Theme.spacing.sm,
    paddingTop: Theme.spacing.xs,
  },
  compactCard: {
    marginBottom: Theme.spacing.xs,
    borderLeftWidth: 3,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Colors.surface,
    ...Theme.shadows.small,
  },
  compactCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.sm,
  },
  compactCardLeft: {
    flex: 1,
  },
  compactCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  compactFoodName: {
    fontSize: Theme.typography.body.fontSize,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  compactLowStockBadge: {
    backgroundColor: Colors.warning,
    paddingHorizontal: Theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.round,
    marginLeft: Theme.spacing.xs,
  },
  compactLowStockText: {
    color: Colors.textInverse,
    fontSize: Theme.typography.small.fontSize,
    fontWeight: '600',
  },
  compactCardDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  compactDetailText: {
    fontSize: Theme.typography.small.fontSize,
    color: Colors.textSecondary,
  },
  compactStorageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  compactCardRight: {
    alignItems: 'flex-end',
  },
  compactExpiryBadge: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.round,
    marginBottom: Theme.spacing.xs,
  },
  compactExpiryBadgeText: {
    color: Colors.textInverse,
    fontSize: Theme.typography.small.fontSize,
    fontWeight: '700',
  },
  compactExpiryDate: {
    fontSize: Theme.typography.small.fontSize,
    color: Colors.textDisabled,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Theme.spacing.xl,
  },
  emptyText: {
    fontSize: Theme.typography.h4.fontSize,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.xs,
  },
  emptySubtext: {
    fontSize: Theme.typography.body.fontSize,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Theme.spacing.md,
    fontSize: Theme.typography.body.fontSize,
    color: Colors.textSecondary,
  },
  title: {
    fontSize: Theme.typography.h3.fontSize,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: Theme.spacing.xl,
  },
};

export default CompactViewScreen;
>>>>>>> c80437fa78717037afb478adf4ee109291017435
