import React, { useState } from 'react';
import { View, Text, Button, ActivityIndicator, StyleSheet } from 'react-native';

export default function RecipeRecommendationScreen() {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const mockGPTCall = async () => {
  setLoading(true);

  const myIngredients = ['계란', '김치', '두부', '파'];

  const prompt = `
  내 재료: ${myIngredients.join(', ')}
  이 재료들로 만들 수 있는 한국 가정식 레시피 3개 추천해줘. 
  형식은 아래처럼 줘.
  1. 요리 이름 - 재료 리스트 - 한 줄 설명
  `;

  console.log('📤 GPT에 보낼 프롬프트:', prompt);

  // 가짜 응답 흉내
  setTimeout(() => {
    setResponse(
      `1. 김치찌개 - 김치, 두부, 파 - 얼큰하고 구수한 찌개  
2. 계란말이 - 계란, 파 - 간단하고 부드러운 반찬  
3. 두부조림 - 두부, 간장, 파 - 매콤짭짤한 반찬`
    );
    setLoading(false);
  }, 2000);
};


  return (
    <View style={styles.container}>
      <Button title="GPT 레시피 추천 받기" onPress={mockGPTCall} />

      {loading && <ActivityIndicator size="large" style={{ marginTop: 20 }} />}

      {response !== '' && (
        <Text style={styles.response}>{response}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    backgroundColor: 'white',
  },
  response: {
    marginTop: 20,
    fontSize: 16,
    lineHeight: 24,
  },
});
