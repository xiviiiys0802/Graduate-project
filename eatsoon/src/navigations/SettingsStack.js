// SettingsStack.js

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MoreScreen from '../screens/MoreScreen';
import RecipeRecommendationScreen from '../screens/RecipeRecommendationScreen';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';
import StatisticsReportScreen from '../screens/StatisticsReportScreen';
import ShoppingListScreen from '../screens/ShoppingListScreen';

const Stack = createNativeStackNavigator();

export default function SettingsStack() {
    console.log('✅ SettingsStack loaded'); 
    return (
    <Stack.Navigator>
      <Stack.Screen name="More" component={MoreScreen} />
      <Stack.Screen name="RecipeRecommendation" component={RecipeRecommendationScreen} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
      <Stack.Screen name="StatisticsReport" component={StatisticsReportScreen} />
      <Stack.Screen name="ShoppingList" component={ShoppingListScreen} />
    </Stack.Navigator>
  );
}
