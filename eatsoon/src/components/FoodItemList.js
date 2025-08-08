import React, { useState, useEffect } from 'react';
import { FlatList, View, Text, Button, Alert } from 'react-native';
import { Container, Title } from './StyledComponents';
import { 
  loadFoodItemsFromFirestore, 
  deleteFoodItemFromFirestore 
} from '../utils/firebaseStorage';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';


const FoodItemList = ({ onItemDeleted, refreshTrigger }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const { user } = useAuth();

    const handleAddPress = () => {
        navigation.navigate('AddFood'); // Stack의 AddFoodScreen으로 이동
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
          onPress: async () => {
            try {
              await deleteFoodItemFromFirestore(itemId);
              await loadItems(); // 목록 새로고침
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

  // 헤더 컴포넌트 추가
  const renderHeader = () => (
    <View style={{ padding: 15, paddingBottom: 0 }}>
      <Title>음식 재고 목록</Title>
      <View style={{ marginVertical: 15 }}>
        <Button
          title="➕ 재고 추가하기"
          color="#4f62c0"
          onPress={handleAddPress}
        />
      </View>
    </View>
  );

  const renderItem = ({ item }) => {
    const isExpiringSoon = new Date(item.expirationDate) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    
    return (
      <View style={{
        backgroundColor: isExpiringSoon ? '#ffebee' : '#fff',
        padding: 15,
        marginBottom: 10,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: isExpiringSoon ? '#f44336' : '#ddd',
      }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{item.name}</Text>
        <Text style={{ color: '#666' }}>수량: {item.quantity}</Text>
        {item.category && (
          <Text style={{ color: '#666' }}>카테고리: {item.category}</Text>
        )}
        <Text style={{ color: isExpiringSoon ? '#f44336' : '#666' }}>
          유통기한: {item.expirationDate}
        </Text>
        <Text style={{ color: '#888', fontSize: 12 }}>
          추가날짜: {item.addedDate}
        </Text>
        <Button
          title="삭제"
          onPress={() => handleDelete(item.id)}
          color="#f44336"
        />
      </View>
    );
  };

  // 로딩 상태나 빈 리스트 처리를 위한 컴포넌트
  const renderEmptyComponent = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 }}>
      <Text>등록된 음식이 없습니다.</Text>
    </View>
  );

  if (!user) {
    return (
      <Container>
        <Title>로그인이 필요합니다</Title>
      </Container>
    );
  }

  return (
    <Container>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader} // 헤더에 제목과 버튼 포함
        ListEmptyComponent={renderEmptyComponent} // 빈 리스트 처리
        // VirtualizedList 기본 제공하는 당겨서 새로고침 props 사용
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      />
      {loading && (
        <View style={{ position: 'absolute', top: '50%', alignSelf: 'center' }}>
          <Text>불러오는 중...</Text>
        </View>
      )}
    </Container>
  );
};

export default FoodItemList;