import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, Alert, StyleSheet } from 'react-native';
import DateTimePicker from 'react-native-ui-datepicker';
import { v4 as uuidv4 } from 'uuid';
import { Container, Title, Button, ButtonText, Input } from './StyledComponents';
import { saveFoodItemToFirestore } from '../utils/firebaseStorage';
import { useAuth } from '../contexts/AuthContext';
import { scheduleExpiryNotification, scheduleStockNotification } from '../utils/notifications';
import VoiceRecognitionButton from './VoiceRecognitionButton';
import { Colors, Theme } from '../utils/colors';
import { Ionicons } from '@expo/vector-icons';
import StatisticsService from '../services/statisticsService';

const FoodItemForm = ({ onItemAdded }) => {
  const [name, setName] = useState('');
  const [expirationDate, setExpirationDate] = useState(new Date());
  const [quantity, setQuantity] = useState('1');
  const [category, setCategory] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [voiceResult, setVoiceResult] = useState(null);
  
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

  const handleVoiceResult = (result) => {
    setVoiceResult(result);
    setName(result.name);
    setQuantity(result.quantity.toString());
    
    // 카테고리 자동 추정
    const categoryMap = {
      '사과': '과일', '바나나': '과일', '오렌지': '과일', '포도': '과일',
      '우유': '유제품', '치즈': '유제품', '요거트': '유제품',
      '빵': '곡물', '쌀': '곡물', '밀가루': '곡물',
      '계란': '육류', '치킨': '육류', '돼지고기': '육류', '소고기': '육류',
      '양파': '채소', '당근': '채소', '감자': '채소', '김치': '채소'
    };
    
    const estimatedCategory = categoryMap[result.name] || '';
    setCategory(estimatedCategory);
  };

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
      
      // 통계 업데이트
      try {
        const categoryKey = getCategoryKey(category.trim() || 'others');
        await StatisticsService.addFoodItem(categoryKey);
      } catch (statError) {
        console.error('통계 업데이트 실패:', statError);
      }
      
      // 알림 예약
      try {
        await scheduleExpiryNotification(newItem);
        
        if (newItem.quantity <= 2) {
          await scheduleStockNotification(newItem);
        }
        
        console.log('알림이 성공적으로 예약되었습니다.');
      } catch (notificationError) {
        console.error('알림 예약 실패:', notificationError);
      }
      
      // 폼 초기화
      setName('');
      setQuantity('1');
      setCategory('');
      setExpirationDate(new Date());
      setVoiceResult(null);
      
      Alert.alert('성공', '음식 아이템이 추가되었습니다.');
      
      if (onItemAdded) {
        onItemAdded();
      }
    } catch (error) {
      Alert.alert('오류', '음식 아이템 추가에 실패했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearVoiceResult = () => {
    setVoiceResult(null);
  };

  return (
    <Container>
      <Title>음식 추가</Title>
      
      {/* 음성인식 섹션 */}
      <View style={styles.voiceSection}>
        <Text style={styles.voiceTitle}>음성으로 음식 추가하기</Text>
        <VoiceRecognitionButton 
          onResult={handleVoiceResult}
          disabled={loading}
        />
        
        {voiceResult && (
          <View style={styles.voiceResultContainer}>
            <View style={styles.voiceResult}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.voiceResultText}>
                인식됨: {voiceResult.name} {voiceResult.quantity}개
              </Text>
              <TouchableOpacity onPress={clearVoiceResult} style={styles.clearButton}>
                <Ionicons name="close" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <View style={styles.divider} />
      
      {/* 수동 입력 섹션 */}
      <Text style={styles.sectionTitle}>수동으로 입력하기</Text>
      
      <Input
        placeholder="음식 이름"
        value={name}
        onChangeText={setName}
      />
      
      <Input
        placeholder="수량"
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="numeric"
      />
      
      <Input
        placeholder="카테고리 (선택사항)"
        value={category}
        onChangeText={setCategory}
      />
      
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Ionicons name="calendar" size={20} color={Colors.textSecondary} />
        <Text style={styles.dateButtonText}>
          유통기한: {expirationDate.toLocaleDateString()}
        </Text>
        <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
      </TouchableOpacity>
      
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
        onPress={handleSubmit}
        disabled={loading}
        style={styles.submitButton}
      >
        <ButtonText>
          {loading ? "추가 중..." : "추가하기"}
        </ButtonText>
      </Button>
    </Container>
  );
};

const styles = StyleSheet.create({
  voiceSection: {
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  voiceTitle: {
    fontSize: Theme.typography.h3.fontSize,
    fontWeight: Theme.typography.h3.fontWeight,
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.md,
  },
  voiceResultContainer: {
    marginTop: Theme.spacing.md,
    width: '100%',
  },
  voiceResult: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success + '20',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },
  voiceResultText: {
    flex: 1,
    fontSize: Theme.typography.body.fontSize,
    color: Colors.textPrimary,
    marginLeft: Theme.spacing.sm,
  },
  clearButton: {
    padding: Theme.spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: Theme.typography.h3.fontSize,
    fontWeight: Theme.typography.h3.fontWeight,
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.md,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.md,
  },
  dateButtonText: {
    flex: 1,
    fontSize: Theme.typography.body.fontSize,
    color: Colors.textPrimary,
    marginLeft: Theme.spacing.sm,
  },
  submitButton: {
    marginTop: Theme.spacing.md,
  },
});

export default FoodItemForm;