<<<<<<< HEAD
=======
// HomeStack.js

>>>>>>> c80437fa78717037afb478adf4ee109291017435
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import CompactViewScreen from '../screens/CompactViewScreen';
import StatisticsReportScreen from '../screens/StatisticsReportScreen';
import NotificationHistoryScreen from '../screens/NotificationHistoryScreen';

const Stack = createNativeStackNavigator();

<<<<<<< HEAD
const HomeStack = () => {
=======
export default function HomeStack() {
>>>>>>> c80437fa78717037afb478adf4ee109291017435
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="HomeMain" 
<<<<<<< HEAD
        component={HomeScreen} 
        options={{ 
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="CompactView" 
        component={CompactViewScreen} 
        options={{ 
          title: '컴팩트 뷰',
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="StatisticsReport" 
        component={StatisticsReportScreen} 
        options={{ 
          title: '사용 통계',
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="NotificationHistory" 
        component={NotificationHistoryScreen} 
        options={{ 
          title: '알림 히스토리',
          headerShown: true 
        }} 
      />
    </Stack.Navigator>
  );
};

export default HomeStack;
=======
        component={HomeScreen}
        options={{ 
          headerShown: false
        }}
      />
      <Stack.Screen 
        name="CompactView" 
        component={CompactViewScreen}
        options={{ 
          title: '컴팩트 뷰',
          headerShown: true 
        }}
      />
      <Stack.Screen 
        name="StatisticsReport" 
        component={StatisticsReportScreen}
        options={{ 
          title: '통계 리포트',
          headerShown: true 
        }}
      />
      <Stack.Screen 
        name="NotificationHistory" 
        component={NotificationHistoryScreen}
        options={{ 
          title: '알림 히스토리',
          headerShown: true 
        }}
      />
    </Stack.Navigator>
  );
}
>>>>>>> c80437fa78717037afb478adf4ee109291017435
