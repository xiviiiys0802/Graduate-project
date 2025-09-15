import React from 'react';
import { ScrollView } from 'react-native';
import { Container } from '../components/StyledComponents';
import FoodItemForm from '../components/FoodItemForm';

const AddFoodScreen = ({ navigation, route }) => {
  const { editMode = false, itemToEdit = null } = route?.params || {};

  const handleItemAdded = () => {
    // 추가/수정 완료 후 홈 화면으로 이동
    navigation.goBack();
  };

  return (
    <Container>
      <ScrollView>
        <FoodItemForm 
          onItemAdded={handleItemAdded}
          editMode={editMode}
          itemToEdit={itemToEdit}
        />
      </ScrollView>
    </Container>
  );
};

export default AddFoodScreen;