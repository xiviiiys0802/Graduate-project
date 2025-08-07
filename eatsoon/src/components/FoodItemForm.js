import React, { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet } from 'react-native';
import DateTimePicker from 'react-native-ui-datepicker';
import { v4 as uuidv4 } from 'uuid';
import { Container, Title } from './StyledComponents';
import { saveFoodItemToFirestore } from '../utils/firebaseStorage';
import { useAuth } from '../contexts/AuthContext';

const FoodItemForm = ({ onItemAdded }) => {
  const [name, setName] = useState('');
  const [expirationDate, setExpirationDate] = useState(new Date());
  const [quantity, setQuantity] = useState('1');
  const [category, setCategory] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }

    if (!name.trim()) {
      Alert.alert('오류', '음식 이름을 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      const newItem = {
        name: name.trim(),
        expirationDate: expirationDate.toISOString().split('T')[0],
        addedDate: new Date().toISOString().split('T')[0],
        quantity: parseInt(quantity) || 1,
        category: category.trim() || null,
        userId: user.uid
      };

      await saveFoodItemToFirestore(newItem);
      
      // 폼 초기화
      setName('');
      setQuantity('1');
      setCategory('');
      setExpirationDate(new Date());
      
      Alert.alert('성공', '음식 아이템이 추가되었습니다.');
      
      // 부모 컴포넌트에 추가 완료 알림
      if (onItemAdded) {
        onItemAdded();
      }
    } catch (error) {
      Alert.alert('오류', '음식 아이템 추가에 실패했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Title>음식 추가</Title>
      
      <TextInput
        placeholder="음식 이름"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      
      <TextInput
        placeholder="수량"
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="numeric"
        style={styles.input}
      />
      
      <TextInput
        placeholder="카테고리 (선택사항)"
        value={category}
        onChangeText={setCategory}
        style={styles.input}
      />
      
      <Button
        title={`유통기한: ${expirationDate.toLocaleDateString()}`}
        onPress={() => setShowDatePicker(true)}
      />
      
      {showDatePicker && (
        <DateTimePicker
          mode="single"
          date={expirationDate}
          onChange={({ date }) => {
            setExpirationDate(date);
            setShowDatePicker(false);
          }}
        />
      )}
      
      <Button 
        title={loading ? "추가 중..." : "추가하기"} 
        onPress={handleSubmit}
        disabled={loading}
      />
    </Container>
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    fontSize: 16,
  },
});

export default FoodItemForm;