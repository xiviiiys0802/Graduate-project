import React from 'react';
import { View, Text, Button } from 'react-native';
import { db } from '../config/firebase';
import { collection, addDoc } from 'firebase/firestore';

const RecipeRecommendationScreen = () => {
  const addTestRecipe = async () => {
    try {
      await addDoc(collection(db, "recipes"), {
        name: "된장찌개",
        ingredients: ["된장", "두부", "애호박"],
        createdAt: new Date()
      });
      console.log("레시피 저장 완료");
    } catch (error) {
      console.error("레시피 저장 실패: ", error);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Recipe Recommendation Screen</Text>
      <Button title="테스트 레시피 추가" onPress={addTestRecipe} />
    </View>
  );
};

export default RecipeRecommendationScreen;
