import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import TabNavigation from './src/navigations/TabNavigation';
import AddFoodScreen from './src/screens/AddFoodScreen';
import { ActivityIndicator, View } from 'react-native';
import NotificationSettingsScreen from './src/screens/NotificationSettingsScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4f62c0" />
      </View>
    );
  }

  return (
     <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={TabNavigation} />
            {/* AddFood 화면 추가 ✅ */}
            <Stack.Screen 
              name="AddFood" 
              component={AddFoodScreen}
              options={{ 
                headerShown: true,  // 헤더 표시
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
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}