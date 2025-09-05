import React, { useState, useEffect } from 'react';
import { FlatList, View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FoodItemList = ({ onItemDeleted, refreshTrigger }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSortedByExpiry, setIsSortedByExpiry] = useState(false);
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

  const handleAddPress = () => {
    navigation.navigate('AddFood');
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
  }, [user, refreshTrigger, isSortedByExpiry]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadItems();
  };

  const handleToggleSort = () => {
    setIsSortedByExpiry(prev => !prev);
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

  // 헤더 컴포넌트 (버튼만)
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerButtons}>
        <TouchableOpacity style={styles.addButton} onPress={handleAddPress}>
          <Ionicons name="add" size={20} color={Colors.textInverse} />
          <Text style={styles.addButtonText}>재고 추가</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.sortButton, isSortedByExpiry && styles.sortButtonActive]} 
          onPress={handleToggleSort}
        >
          <Ionicons 
            name={isSortedByExpiry ? "calendar" : "list"} 
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

  // 음식 아이템 카드
  const renderItem = ({ item }) => {
    const expiryStatus = getExpiryStatus(item.expirationDate);
    const isLowStock = item.quantity <= 2;
    
    return (
      <Card style={[styles.foodCard, { borderLeftColor: expiryStatus.color }]}>
        <View style={styles.cardHeader}>
          <View style={styles.foodInfo}>
            <View style={styles.foodTitleRow}>
              <Ionicons 
                name={getCategoryIcon(item.category)} 
                size={20} 
                color={Colors.textSecondary} 
                style={styles.categoryIcon}
              />
              <Text style={styles.foodName}>{item.name}</Text>
              {isLowStock && (
                <View style={styles.lowStockBadge}>
                  <Text style={styles.lowStockText}>부족</Text>
                </View>
              )}
            </View>
            
            <View style={styles.foodDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="cube" size={14} color={Colors.textSecondary} />
                <Text style={styles.detailText}>수량: {item.quantity}개</Text>
              </View>
              
              {item.category && (
                <View style={styles.detailRow}>
                  <Ionicons name="pricetag" size={14} color={Colors.textSecondary} />
                  <Text style={styles.detailText}>{item.category}</Text>
                </View>
              )}
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={() => handleDelete(item.id)}
          >
            <Ionicons name="trash-outline" size={20} color={Colors.danger} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.expirySection}>
          <View style={styles.expiryRow}>
            <Ionicons name="calendar" size={16} color={expiryStatus.color} />
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
        
        <Text style={styles.addedDate}>
          추가: {item.addedDate}
        </Text>
      </Card>
    );
  };

  // 빈 상태 컴포넌트
  const renderEmptyComponent = () => (
    <EmptyContainer>
      <Ionicons name="fast-food-outline" size={64} color={Colors.textSecondary} />
      <EmptyText>등록된 음식이 없습니다</EmptyText>
      <Text style={styles.emptySubtext}>
        재고를 추가하여 음식 관리를 시작해보세요!
      </Text>
    </EmptyContainer>
  );

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

  return (
    <Container>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </Container>
  );
};

const styles = {
  header: {
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: 0,
    paddingBottom: Theme.spacing.md,
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 0,
    gap: Theme.spacing.sm,
  },
  addButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    ...Theme.shadows.small,
  },
  addButtonText: {
    color: Colors.textInverse,
    fontSize: Theme.typography.body.fontSize,
    fontWeight: '600',
    marginLeft: Theme.spacing.xs,
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
    fontSize: Theme.typography.caption.fontSize,
    color: Colors.textSecondary,
    marginLeft: Theme.spacing.xs,
  },
  sortButtonTextActive: {
    color: Colors.textInverse,
  },
  listContainer: {
    flexGrow: 1,
    paddingHorizontal: Theme.spacing.md,
    paddingTop: 0,
  },
  foodCard: {
    marginBottom: Theme.spacing.md,
    borderLeftWidth: 4,
    ...Theme.shadows.small,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.md,
  },
  foodInfo: {
    flex: 1,
  },
  foodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  categoryIcon: {
    marginRight: Theme.spacing.sm,
  },
  foodName: {
    fontSize: Theme.typography.h3.fontSize,
    fontWeight: Theme.typography.h3.fontWeight,
    color: Colors.textPrimary,
    flex: 1,
  },
  lowStockBadge: {
    backgroundColor: Colors.warning,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.round,
  },
  lowStockText: {
    color: Colors.textInverse,
    fontSize: Theme.typography.small.fontSize,
    fontWeight: '500',
  },
  foodDetails: {
    gap: Theme.spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: Theme.typography.caption.fontSize,
    color: Colors.textSecondary,
    marginLeft: Theme.spacing.xs,
  },
  deleteButton: {
    padding: Theme.spacing.sm,
  },
  expirySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  expiryText: {
    fontSize: Theme.typography.caption.fontSize,
    fontWeight: '500',
    marginLeft: Theme.spacing.xs,
  },
  expiryBadge: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.round,
  },
  expiryBadgeText: {
    color: Colors.textInverse,
    fontSize: Theme.typography.small.fontSize,
    fontWeight: '600',
  },
  addedDate: {
    fontSize: Theme.typography.small.fontSize,
    color: Colors.textDisabled,
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
  },
};

export default FoodItemList;