// App.js

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import TabNavigation from './src/navigations/TabNavigation';
import Constants from 'expo-constants';
import { registerForPushNotificationsAsync } from './src/utils/notification';

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
      <TabNavigation />
    </NavigationContainer>
  );
}
