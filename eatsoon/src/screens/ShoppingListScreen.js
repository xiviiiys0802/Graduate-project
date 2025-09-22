import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { 
  addItem, 
  toggleCheck, 
  updateItem, 
  deleteItem, 
  listAll, 
  markAllChecked, 
  deleteAllChecked 
} from '../utils/shoppingList';

export default function ShoppingListScreen() {
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = listAll((shoppingItems) => {
      // 정렬: 체크되지 않은 항목을 이름순으로 상단에, 체크된 항목을 최근 활동순으로 하단에
      const sortedItems = shoppingItems.sort((a, b) => {
        if (a.checked !== b.checked) {
          return a.checked ? 1 : -1; // 체크되지 않은 항목이 위로
        }
        if (!a.checked && !b.checked) {
          return (a.name || '').localeCompare(b.name || ''); // 체크되지 않은 항목은 이름순
        }
        // 체크된 항목은 최근 활동순 (updatedAt 내림차순)
        const aTime = a.updatedAt?.toDate?.() || new Date(0);
        const bTime = b.updatedAt?.toDate?.() || new Date(0);
        return bTime - aTime;
      });
      setItems(sortedItems);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;

    try {
      await addItem(newItemName.trim(), 1, '개');
      setNewItemName('');
    } catch (error) {
      Alert.alert('오류', '항목 추가에 실패했습니다.');
    }
  };

  const handleToggleCheck = async (itemId) => {
    try {
      await toggleCheck(itemId);
    } catch (error) {
      Alert.alert('오류', '상태 변경에 실패했습니다.');
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

  const handleUpdateQuantity = async (itemId, currentQuantity, delta) => {
    const item = items.find(item => item.id === itemId);
    if (!item) return;

    let newQuantity;
    if (isMeatItem(item) && item.unit === 'g') {
      // 고기류는 50g 단위로 조절
      newQuantity = Math.max(50, currentQuantity + (delta * 50));
    } else {
      // 일반 재료는 1개 단위로 조절
      newQuantity = Math.max(1, currentQuantity + delta);
    }

    try {
      await updateItem(itemId, { quantity: newQuantity });
    } catch (error) {
      Alert.alert('오류', '수량 변경에 실패했습니다.');
    }
  };

  const handleDeleteItem = async (itemId) => {
    const item = items.find(item => item.id === itemId);
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
              Alert.alert('오류', '삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const handleMarkAllChecked = async () => {
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
            } catch (error) {
              Alert.alert('오류', '작업에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAllChecked = async () => {
    const checkedCount = (items?.filter(item => item.checked) || []).length;
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
            } catch (error) {
              Alert.alert('오류', '삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };


  const renderItem = ({ item }) => (
    <View style={[styles.itemContainer, item.checked && styles.checkedItem]}>
      <View style={styles.itemContent}>
        <TouchableOpacity
          style={styles.itemLeft}
          onPress={() => handleToggleCheck(item.id)}
        >
          <View style={[styles.checkbox, item.checked && styles.checkedBox]}>
            {item.checked && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={[styles.itemName, item.checked && styles.checkedText]}>
            {item.name}
          </Text>
        </TouchableOpacity>
          
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleUpdateQuantity(item.id, item.quantity, -1)}
            >
              <Text style={styles.quantityButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.quantityText}>{item.quantity}{item.unit || '개'}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleUpdateQuantity(item.id, item.quantity, 1)}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteItem(item.id)}
            >
              <Text style={styles.deleteButtonText}>×</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>장보기 리스트를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>장보기 리스트</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleMarkAllChecked}
          >
            <Text style={styles.headerButtonText}>모두 구매완료</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, styles.deleteButton]}
            onPress={handleDeleteAllChecked}
          >
            <Text style={styles.headerButtonText}>체크삭제</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="새 항목 추가..."
          value={newItemName}
          onChangeText={setNewItemName}
          onSubmitEditing={handleAddItem}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
          <Text style={styles.addButtonText}>추가</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>장보기 항목이 없습니다</Text>
            <Text style={styles.emptySubText}>위에서 새 항목을 추가해보세요</Text>
          </View>
        }
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007bff',
    borderRadius: 6,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    fontSize: 16,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#28a745',
    borderRadius: 6,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  list: {
    flex: 1,
  },
  itemContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  checkedItem: {
    backgroundColor: '#f8f9fa',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#dee2e6',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemName: {
    fontSize: 16,
    color: '#212529',
    flex: 1,
  },
  checkedText: {
    textDecorationLine: 'line-through',
    color: '#6c757d',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    backgroundColor: '#007bff',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '500',
    marginHorizontal: 12,
    minWidth: 24,
    textAlign: 'center',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#6c757d',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#adb5bd',
  },
});