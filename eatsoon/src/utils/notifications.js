// src/utils/notification.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { auth } from '../config/firebase'; // Firebase 초기화 파일
import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveNotificationHistory } from './notificationHistory';
import StatisticsService from '../services/statisticsService';

const db = getFirestore(); // Firestore 인스턴스

// ✅ 알림 권한 요청만 따로 분리한 함수
export async function requestNotificationPermission() {
  const settings = await Notifications.getPermissionsAsync();
  let finalStatus = settings.status;

  if (finalStatus !== 'granted') {
    const { status: requestedStatus } = await Notifications.requestPermissionsAsync();
    finalStatus = requestedStatus;
  }

  if (finalStatus !== 'granted') {
    Alert.alert(
      '알림 권한이 꺼져 있어요',
      '알림을 받으려면 설정에서 권한을 켜주세요.',
      [
        { text: '취소', style: 'cancel' },
        { text: '설정으로 이동', onPress: () => Linking.openSettings() },
      ]
    );
    return null;
  }

  console.log('✅ 알림 권한이 허용됨');
  return finalStatus;
}

// ✅ 푸시 토큰 발급 및 Firestore 저장 함수
export async function registerForPushNotificationsAsync() {
  let token = null;

  if (Device.isDevice) {
    const permission = await requestNotificationPermission();
    if (!permission !== 'granted') {
      return null; // 권한이 없으면 토큰 발급하지 않음
    } 

    // 푸시 토큰 발급
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('푸시 토큰:', token);

    // ✅ Firestore에 저장
    const user = auth.currentUser || getAuth().currentUser;
    if (user) {
      try {
        await setDoc(
          doc(db, 'users', user.uid),
          { expoPushToken: token },
          { merge: true } // 기존 필드 유지
        );
        console.log('푸시 토큰이 Firestore에 저장되었습니다.');
      } catch (error) {
        console.error('Firestore 저장 오류:', error);
      }
    } else {
      console.warn('로그인된 사용자가 없습니다. 푸시 토큰 저장 생략됨.');
    }
  } else {
    Alert.alert('푸시 알림은 물리 디바이스에서만 작동합니다.');
  }

  // ✅ 안드로이드 채널 설정
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });

    // 유통기한 알림용 채널
    Notifications.setNotificationChannelAsync('expiry', {
      name: '유통기한 알림',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
    });

    // 재고 알림용 채널
    Notifications.setNotificationChannelAsync('stock', {
      name: '재고 알림',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4CAF50',
      sound: 'default',
    });
  }

  return token;
}

// ✅ 알림 스케줄링 함수들

// 유통기한 알림 예약
export async function scheduleExpiryNotification(foodItem) {
  try {
    const settings = await loadNotificationSettings();
    const expiryDate = new Date(foodItem.expirationDate);
    const now = new Date();
    
    // 유통기한이 이미 지났으면 알림 예약하지 않음
    if (expiryDate <= now) {
      return null;
    }

    // 사용자 설정에 따른 알림 시점
    const notificationTimes = settings.expiryDays.map(days => ({
      days,
      title: days === 0 ? '유통기한 만료 알림' : '유통기한 임박 알림',
      body: days === 0 
        ? `${foodItem.name}의 유통기한이 오늘입니다.`
        : `${foodItem.name}의 유통기한이 ${days}일 남았습니다.`
    }));

    const scheduledNotifications = [];

    for (const notification of notificationTimes) {
      const triggerDate = new Date(expiryDate);
      triggerDate.setDate(triggerDate.getDate() - notification.days);
      
      // 과거 시간이면 스킵
      if (triggerDate <= now) continue;

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: { 
            type: 'expiry',
            foodId: foodItem.id,
            foodName: foodItem.name,
            daysLeft: notification.days
          },
        },
        trigger: {
          date: triggerDate,
        },
      });

      // 알림 히스토리에 저장
      await saveNotificationHistory({
        type: 'expiry',
        title: notification.title,
        body: notification.body,
        data: { 
          foodId: foodItem.id,
          foodName: foodItem.name,
          daysLeft: notification.days
        },
        scheduledDate: triggerDate,
        daysLeft: notification.days
      });

      scheduledNotifications.push({
        id: identifier,
        foodId: foodItem.id,
        type: 'expiry',
        scheduledDate: triggerDate,
        daysLeft: notification.days
      });

      console.log(`유통기한 알림 예약됨: ${foodItem.name} - ${notification.days}일 전`);
    }

    // 통계 업데이트
    try {
      await StatisticsService.addNotificationSent();
    } catch (statError) {
      console.error('알림 통계 업데이트 실패:', statError);
    }

    // 예약된 알림 정보를 AsyncStorage에 저장
    await saveScheduledNotifications(foodItem.id, scheduledNotifications);

    return scheduledNotifications;
  } catch (error) {
    console.error('유통기한 알림 예약 실패:', error);
    return null;
  }
}

// 재고 부족 알림 예약
export async function scheduleStockNotification(foodItem) {
  try {
    const settings = await loadNotificationSettings();
    const lowStockThreshold = settings.stockThreshold; // 사용자 설정 임계값
    
    if (foodItem.quantity > lowStockThreshold) {
      return null; // 재고가 충분하면 알림 예약하지 않음
    }

    // 중복 알림 방지: 같은 물건, 같은 개수에 대한 최근 알림 확인
    const recentStockNotification = await checkRecentStockNotification(foodItem.id, foodItem.quantity);
    if (recentStockNotification) {
      console.log(`중복 재고 알림 방지: ${foodItem.name} (${foodItem.quantity}개)`);
      return null;
    }

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: '재고 부족 알림',
        body: `${foodItem.name}의 재고가 부족합니다. (${foodItem.quantity}개 남음)`,
        data: { 
          type: 'stock',
          foodId: foodItem.id,
          foodName: foodItem.name,
          quantity: foodItem.quantity
        },
      },
      trigger: {
        seconds: 1, // 즉시 알림
      },
    });

    // 알림 히스토리에 저장
    await saveNotificationHistory({
      type: 'stock',
      title: '재고 부족 알림',
      body: `${foodItem.name}의 재고가 부족합니다. (${foodItem.quantity}개 남음)`,
      data: { 
        foodId: foodItem.id,
        foodName: foodItem.name,
        quantity: foodItem.quantity
      },
      scheduledDate: new Date(),
      quantity: foodItem.quantity
    });

    // 최근 재고 알림 정보 저장 (중복 방지용)
    await saveRecentStockNotification(foodItem.id, foodItem.quantity);

    const scheduledNotification = {
      id: identifier,
      foodId: foodItem.id,
      type: 'stock',
      scheduledDate: new Date(),
      quantity: foodItem.quantity
    };

    // 예약된 알림 정보를 AsyncStorage에 저장
    await saveScheduledNotifications(foodItem.id, [scheduledNotification]);

    console.log(`재고 부족 알림 예약됨: ${foodItem.name}`);
    
    // 통계 업데이트
    try {
      await StatisticsService.addNotificationSent();
    } catch (statError) {
      console.error('알림 통계 업데이트 실패:', statError);
    }
    
    return scheduledNotification;
  } catch (error) {
    console.error('재고 부족 알림 예약 실패:', error);
    return null;
  }
}

// 정기 알림 예약 (사용자 설정 시간)
export async function scheduleDailyNotification() {
  try {
    const settings = await loadNotificationSettings();
    const [hours, minutes] = settings.dailyTime.split(':').map(Number);
    
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'EatSoon 일일 알림',
        body: '오늘의 음식 재고를 확인해보세요!',
        data: { type: 'daily' },
      },
      trigger: {
        hour: hours,
        minute: minutes,
        repeats: true, // 매일 반복
      },
    });

    // 알림 히스토리에 저장
    await saveNotificationHistory({
      type: 'daily',
      title: 'EatSoon 일일 알림',
      body: '오늘의 음식 재고를 확인해보세요!',
      data: { type: 'daily' },
      scheduledDate: new Date(),
    });

    console.log(`정기 알림 예약됨: 매일 ${settings.dailyTime}`);
    
    // 통계 업데이트
    try {
      await StatisticsService.addNotificationSent();
    } catch (statError) {
      console.error('알림 통계 업데이트 실패:', statError);
    }
    
    return identifier;
  } catch (error) {
    console.error('정기 알림 예약 실패:', error);
    return null;
  }
}

// 알림 취소 함수
export async function cancelNotification(notificationId) {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log(`알림 취소됨: ${notificationId}`);
    return true;
  } catch (error) {
    console.error('알림 취소 실패:', error);
    return false;
  }
}

// 특정 음식의 모든 알림 취소
export async function cancelFoodNotifications(foodId) {
  try {
    const notifications = await getScheduledNotifications(foodId);
    
    for (const notification of notifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.id);
    }

    // AsyncStorage에서도 제거
    await removeScheduledNotifications(foodId);
    
    console.log(`${foodId}의 모든 알림이 취소됨`);
    return true;
  } catch (error) {
    console.error('음식 알림 취소 실패:', error);
    return false;
  }
}

// 모든 알림 취소
export async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.removeItem('scheduledNotifications');
    console.log('모든 알림이 취소됨');
    return true;
  } catch (error) {
    console.error('모든 알림 취소 실패:', error);
    return false;
  }
}

// 예약된 알림 정보 저장
async function saveScheduledNotifications(foodId, notifications) {
  try {
    const key = `scheduledNotifications_${foodId}`;
    await AsyncStorage.setItem(key, JSON.stringify(notifications));
  } catch (error) {
    console.error('알림 정보 저장 실패:', error);
  }
}

// 예약된 알림 정보 불러오기
async function getScheduledNotifications(foodId) {
  try {
    const key = `scheduledNotifications_${foodId}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('알림 정보 불러오기 실패:', error);
    return [];
  }
}

// 예약된 알림 정보 제거
async function removeScheduledNotifications(foodId) {
  try {
    const key = `scheduledNotifications_${foodId}`;
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('알림 정보 제거 실패:', error);
  }
}

// 최근 재고 알림 확인 (중복 방지용)
async function checkRecentStockNotification(foodId, quantity) {
  try {
    const key = `recentStockNotification_${foodId}`;
    const data = await AsyncStorage.getItem(key);
    
    if (!data) return false;
    
    const recentNotification = JSON.parse(data);
    const now = new Date();
    const timeDiff = now.getTime() - recentNotification.timestamp;
    
    // 24시간 이내에 같은 개수로 알림을 보냈으면 중복으로 간주
    const isSameQuantity = recentNotification.quantity === quantity;
    const isWithin24Hours = timeDiff < 24 * 60 * 60 * 1000; // 24시간
    
    return isSameQuantity && isWithin24Hours;
  } catch (error) {
    console.error('최근 재고 알림 확인 실패:', error);
    return false;
  }
}

// 최근 재고 알림 정보 저장 (중복 방지용)
async function saveRecentStockNotification(foodId, quantity) {
  try {
    const key = `recentStockNotification_${foodId}`;
    const notificationData = {
      foodId,
      quantity,
      timestamp: new Date().getTime()
    };
    await AsyncStorage.setItem(key, JSON.stringify(notificationData));
  } catch (error) {
    console.error('최근 재고 알림 정보 저장 실패:', error);
  }
}

// 알림 설정 저장
export async function saveNotificationSettings(settings) {
  try {
    await AsyncStorage.setItem('notificationSettings', JSON.stringify(settings));
    console.log('알림 설정이 저장됨');
  } catch (error) {
    console.error('알림 설정 저장 실패:', error);
  }
}

// 알림 설정 불러오기
export async function loadNotificationSettings() {
  try {
    const data = await AsyncStorage.getItem('notificationSettings');
    return data ? JSON.parse(data) : {
      expiryEnabled: true,
      stockEnabled: true,
      dailyEnabled: false,
      expiryDays: [3, 1, 0], // 3일 전, 1일 전, 당일
      dailyTime: '09:00', // 오전 9시
      stockThreshold: 2 // 재고 부족 임계값
    };
  } catch (error) {
    console.error('알림 설정 불러오기 실패:', error);
    return {
      expiryEnabled: true,
      stockEnabled: true,
      dailyEnabled: false,
      expiryDays: [3, 1, 0],
      dailyTime: '09:00',
      stockThreshold: 2
    };
  }
}

