import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import TabNavigation from './src/navigations/TabNavigation';
import AddFoodScreen from './src/screens/AddFoodScreen';
import { ActivityIndicator, View } from 'react-native';
import NotificationSettingsScreen from './src/screens/NotificationSettingsScreen';
import { registerForPushNotificationsAsync, cancelAllNotifications } from './src/utils/notifications';
import * as Notifications from 'expo-notifications';
import { saveNotificationHistory } from './src/utils/notificationHistory';
import { Colors } from './src/utils/colors';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useAuth();

  // 알림 시스템 초기화
  React.useEffect(() => {
    if (user) {
      // 먼저 모든 기존 알림을 취소
      cancelAllNotifications();
      
      registerForPushNotificationsAsync();
      
      // 알림 리스너 설정
      const notificationListener = Notifications.addNotificationReceivedListener(notification => {
        console.log('알림을 받았습니다:', notification);
        
        // 알림 히스토리에 저장
        saveNotificationHistory({
          type: notification.request.content.data?.type || 'unknown',
          title: notification.request.content.title,
          body: notification.request.content.body,
          data: notification.request.content.data,
          receivedAt: new Date().toISOString()
        });
      });

      const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('알림을 탭했습니다:', response);
        
        // 알림 탭 시 추가 처리 (필요시)
        const notificationData = response.notification.request.content.data;
        if (notificationData?.type === 'expiry' && notificationData?.foodId) {
          // 유통기한 알림 탭 시 해당 음식 상세 화면으로 이동 등의 처리
          console.log('유통기한 알림 탭됨:', notificationData.foodName);
        }
      });

      return () => {
        if (notificationListener) {
          notificationListener.remove();
        }
        if (responseListener) {
          responseListener.remove();
        }
      };
    }
  }, [user]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
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