// App.js

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
<<<<<<< Updated upstream
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SignUpScreen from './src/screens/SignUpScreen';
import LoginScreen from './src/screens/LoginScreen';
import MainTabs from './src/navigations/MainTabs';
import NotificationSettingsScreen from './src/screens/NotificationSettingsScreen'; // 경로 수정

const Stack = createNativeStackNavigator();
=======
import TabNavigation from './src/navigations/TabNavigation';
import Constants from 'expo-constants';
import { registerForPushNotificationsAsync } from './src/utils/notification';
>>>>>>> Stashed changes

export default function App() {
  useEffect(() => {
    // dev client에서만 알림 등록 시도
    if (Constants.appOwnership !== 'expo') {
      registerForPushNotificationsAsync();
    } else {
      console.log('🔕 Expo Go 환경에서는 알림 등록을 생략합니다.');
    }
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen
          name="NotificationSettings"
          component={NotificationSettingsScreen}
          options={{ title: '알림 설정' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
