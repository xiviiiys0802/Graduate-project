import React, { useState, useEffect } from 'react';
import { FlatList, View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Container, Title, Card, Button, ButtonText, EmptyContainer, EmptyText, LoadingContainer } from '../components/StyledComponents';
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

const CompactViewScreen = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const { user } = useAuth();

  const getCategoryKey = (category) => {
    const categoryMap = {
      '유제품': 'dairy',
      '육류': 'meat',
      '채소': 'vegetables',
      '과일': 'fruits',
      '곡물': 'grains',
      '기타': 'other'
    };
    return categoryMap[category] || 'other';
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
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadItems();
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
              await cancelFoodNotifications(itemId);
              await deleteFoodItemFromFirestore(itemId);
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

  // 컴팩트 뷰 아이템 렌더링
  const renderItem = ({ item }) => {
    const expiryStatus = getExpiryStatus(item.expirationDate);
    const isLowStock = item.quantity <= 2;
    
    return (
      <Card style={styles.compactCard}>
        <View style={styles.compactContent}>
          <View style={styles.compactLeft}>
            <Ionicons 
              name={getCategoryIcon(item.category)} 
              size={16} 
              color={Colors.primary} 
            />
            <Text style={styles.compactName} numberOfLines={1}>{item.name}</Text>
          </View>
          <View style={styles.compactRight}>
            <Text style={styles.compactQuantity}>{item.quantity}개</Text>
            {isLowStock && (
              <View style={styles.compactLowStock}>
                <Text style={styles.compactLowStockText}>!</Text>
              </View>
            )}
          </View>
        </View>
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
  listContainer: {
    padding: Theme.spacing.md,
  },
  compactCard: {
    marginHorizontal: Theme.spacing.md,
    marginVertical: Theme.spacing.xs,
    padding: Theme.spacing.sm,
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
    gap: Theme.spacing.sm,
  },
  compactRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  compactName: {
    fontSize: Theme.typography.body.fontSize,
    color: Colors.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  compactQuantity: {
    fontSize: Theme.typography.small.fontSize,
    color: Colors.textSecondary,
  },
  compactLowStock: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactLowStockText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptySubtext: {
    fontSize: Theme.typography.caption.fontSize,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Theme.spacing.sm,
  },
  loadingText: {
    fontSize: Theme.typography.caption.fontSize,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Theme.spacing.sm,
  },
};

export default CompactViewScreen;
