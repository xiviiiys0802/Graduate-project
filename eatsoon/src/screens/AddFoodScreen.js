import React from 'react';
import { ScrollView } from 'react-native';
import { Container } from '../components/StyledComponents';
import FoodItemForm from '../components/FoodItemForm';

const AddFoodScreen = ({ navigation }) => {
  const handleItemAdded = () => {
    // 추가 완료 후 홈 화면으로 이동
    navigation.goBack();
  };

  return (
    <Container>
      <ScrollView>
        <FoodItemForm onItemAdded={handleItemAdded} />
      </ScrollView>
    </Container>
  );
};

export default AddFoodScreen;