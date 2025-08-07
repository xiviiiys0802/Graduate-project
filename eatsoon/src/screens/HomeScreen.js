import React, { useState, useCallback } from 'react';
import { Container } from '../components/StyledComponents';
import FoodItemList from '../components/FoodItemList';
import { useAuth } from '../contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

const HomeScreen = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user } = useAuth();

  // 화면이 포커스될 때마다 목록 새로고침
  useFocusEffect(
    useCallback(() => {
      if (user) {
        setRefreshTrigger(prev => prev + 1);
      }
    }, [user])
  );

  const handleItemDeleted = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <Container>
        <FoodItemList 
          onItemDeleted={handleItemDeleted}
          refreshTrigger={refreshTrigger}
        />
    </Container>
  );
};

export default HomeScreen;