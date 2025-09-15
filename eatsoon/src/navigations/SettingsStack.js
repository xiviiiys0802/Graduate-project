// SettingsStack.js

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MoreScreen from '../screens/MoreScreen';
import RecipeRecommendationScreen from '../screens/RecipeRecommendationScreen';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';
import ShoppingListScreen from '../screens/ShoppingListScreen';
import ProfileEditScreen from '../screens/ProfileEditScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/TermsOfServiceScreen';
import HelpScreen from '../screens/HelpScreen';
import StatisticsReportScreen from '../screens/StatisticsReportScreen';
import NotificationHistoryScreen from '../screens/NotificationHistoryScreen';

const Stack = createNativeStackNavigator();

export default function SettingsStack() {
    console.log('✅ SettingsStack loaded'); 
    return (
    <Stack.Navigator initialRouteName="More">
      <Stack.Screen 
        name="More" 
        component={MoreScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="RecipeRecommendation" 
        component={RecipeRecommendationScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="RecipeDetail" 
        component={RecipeDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ShoppingList" 
        component={ShoppingListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ProfileEdit" 
        component={ProfileEditScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Privacy" 
        component={PrivacyScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="PrivacyPolicy" 
        component={PrivacyPolicyScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="TermsOfService" 
        component={TermsOfServiceScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Help" 
        component={HelpScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="StatisticsReport" 
        component={StatisticsReportScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="NotificationHistory" 
        component={NotificationHistoryScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
