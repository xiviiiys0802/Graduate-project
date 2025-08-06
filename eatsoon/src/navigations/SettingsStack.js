// SettingsStack.js

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SettingsScreen from '../screens/SettingsScreen';
import RecipeRecommendationScreen from '../screens/RecipeRecommendationScreen';
import StatisticsReportScreen from '../screens/StatisticsReportScreen';
import ShoppingListScreen from '../screens/ShoppingListScreen';

const Stack = createNativeStackNavigator();

export default function SettingsStack() {
    console.log('✅ SettingsStack loaded'); 
    return (
    <Stack.Navigator>
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="RecipeRecommendation" component={RecipeRecommendationScreen} />
      <Stack.Screen name="StatisticsReport" component={StatisticsReportScreen} />
      <Stack.Screen name="ShoppingList" component={ShoppingListScreen} />
    </Stack.Navigator>
  );
}
