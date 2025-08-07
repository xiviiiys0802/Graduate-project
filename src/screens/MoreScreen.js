// src/screens/MoreScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function MoreScreen() {
  const navigation = useNavigation();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>기능</Text>

      <TouchableOpacity style={styles.recipeBox} onPress={() => navigation.navigate('RecipeRecommendation')}>
        <Text style={styles.recipeText}>레시피 추천</Text>
      </TouchableOpacity>

      <View style={styles.bottomRow}>
        <TouchableOpacity style={styles.leftBox} onPress={() => navigation.navigate('StatisticsReport')}>
          <Text>통계/리포트</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.rightBox} onPress={() => navigation.navigate('ShoppingList')}>
          <Text>장보기 리스트</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  recipeBox: {
    height: 150,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: '#ffe0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeText: {
    fontSize: 18,
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  leftBox: {
    flex: 1,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#d0f0ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightBox: {
    flex: 1,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#d0ffd0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
