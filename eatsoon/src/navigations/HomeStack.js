import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import CompactViewScreen from '../screens/CompactViewScreen';
import StatisticsReportScreen from '../screens/StatisticsReportScreen';
import NotificationHistoryScreen from '../screens/NotificationHistoryScreen';
import RecipeRecommendationScreen from '../screens/RecipeRecommendationScreen';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';
import ShoppingListScreen from '../screens/ShoppingListScreen';
import HelpScreen from '../screens/HelpScreen';

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator initialRouteName="HomeMain">
      <Stack.Screen 
        name="HomeMain" 
        component={HomeScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="CompactView" 
        component={CompactViewScreen}
        options={{
          title: '컴팩트 뷰',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="StatisticsReport" 
        component={StatisticsReportScreen}
        options={{
          title: '사용 통계',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="NotificationHistory" 
        component={NotificationHistoryScreen}
        options={{
          title: '알림 히스토리',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="RecipeRecommendation" 
        component={RecipeRecommendationScreen}
        options={{
          title: '레시피 추천',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="RecipeDetail" 
        component={RecipeDetailScreen}
        options={{
          title: '레시피 상세',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="ShoppingList" 
        component={ShoppingListScreen}
        options={{
          title: '장보기 리스트',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="Help" 
        component={HelpScreen}
        options={{
          title: '도움말',
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
}