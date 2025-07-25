// App.js
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

import SignUpScreen from './src/screens/SignUpScreen';
import LoginScreen from './src/screens/LoginScreen';
import MainTabs from './src/navigations/MainTabs';
import NotificationSettingsScreen from './src/screens/NotificationSettingsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(null); // 초기에는 null

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setIsLoggedIn(!!user);
    });
    return unsubscribe;
  }, []);

  if (isLoggedIn === null) return null; // 로딩 중일 때 아무 것도 렌더링하지 않음

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={isLoggedIn ? 'MainTabs' : 'Login'}>
        {!isLoggedIn && (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        )}
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
