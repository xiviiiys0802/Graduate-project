import React, { useState, useCallback } from 'react';
import { Container } from '../components/StyledComponents';
import FoodItemList from '../components/FoodItemList';
import { useAuth } from '../contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { loadFoodItemsFromFirestore } from '../utils/firebaseStorage';
import { scheduleExpiryNotification, scheduleStockNotification } from '../utils/notifications';
import StatisticsService from '../services/statisticsService';

const HomeScreen = ({ route }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user } = useAuth();
  
  // 프로필에서 전달된 필터 파라미터
  const initialFilter = route?.params?.filter || null;

  // 화면이 포커스될 때마다 목록 새로고침
  useFocusEffect(
    useCallback(() => {
      if (user) {
        setRefreshTrigger(prev => prev + 1);
        
        // 기존 음식 아이템들에 대한 알림 예약 (앱 첫 실행 시)
        initializeNotifications();
      }
    }, [user])
  );

  const initializeNotifications = async () => {
    try {
      const foodItems = await loadFoodItemsFromFirestore() || [];
      
      let expiringSoonCount = 0;
      let expiredCount = 0;
      
      for (const item of foodItems) {
        // 유통기한 알림 예약
        await scheduleExpiryNotification(item);
        
        // 재고 부족 알림 예약
        if (item.quantity <= 2) {
          await scheduleStockNotification(item);
        }
        
        // 유통기한 상태 확인
        const expiryDate = new Date(item.expirationDate);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry <= 0) {
          expiredCount++;
        } else if (daysUntilExpiry <= 3) {
          expiringSoonCount++;
        }
      }
      
      // 통계 업데이트
      try {
        await StatisticsService.updateExpiringItems(expiringSoonCount);
        await StatisticsService.updateExpiredItems(expiredCount);
      } catch (statError) {
        console.error('통계 업데이트 실패:', statError);
      }
      
      console.log('기존 음식 아이템들의 알림이 초기화되었습니다.');
    } catch (error) {
      console.error('알림 초기화 실패:', error);
    }
  };

  const handleItemDeleted = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <Container>
        <FoodItemList 
          onItemDeleted={handleItemDeleted}
          refreshTrigger={refreshTrigger}
          initialFilter={initialFilter}
        />
    </Container>
  );
};

export default HomeScreen;