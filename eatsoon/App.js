import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

import SignUpScreen from './src/screens/SignUpScreen';
import LoginScreen from './src/screens/LoginScreen';
import TabNavigation from './src/navigations/TabNavigation';
import AddFoodScreen from './src/screens/AddFoodScreen';
import NotificationSettingsScreen from './src/screens/NotificationSettingsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setIsLoggedIn(!!user);
    });
    return unsubscribe;
  }, []);

  if (isLoggedIn === null) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={isLoggedIn ? 'Main' : 'Login'}>
        {!isLoggedIn && (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        )}
        {isLoggedIn && (
          <>
            <Stack.Screen
              name="Main"
              component={TabNavigation}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="AddFood"
              component={AddFoodScreen}
              options={{
                headerShown: true,
                title: '재고 추가하기',
                headerBackTitle: '뒤로'
              }}
            />
            <Stack.Screen
              name="NotificationSettings"
              component={NotificationSettingsScreen}
              options={{ title: '알림 설정' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
