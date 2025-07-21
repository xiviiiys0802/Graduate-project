import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SignUpScreen from './src/screens/SignUpScreen';
import TabNavigation from './src/navigations/TabNavigation'; // 메인 탭

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SignUp">
        <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: '회원가입' }} />
        <Stack.Screen name="MainTabs" component={TabNavigation} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
