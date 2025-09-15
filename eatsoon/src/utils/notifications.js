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
    
    // 유통기한 알림이 비활성화되어 있으면 스킵
    if (!settings.expiryEnabled) {
      console.log('유통기한 알림이 비활성화되어 있습니다.');
      return null;
    }

    // 우선순위 모드가 silent이면 스킵
    if (settings.priorityMode === 'silent') {
      console.log('알림 우선순위가 조용함 모드입니다.');
      return null;
    }

    // 날짜 문자열을 안전하게 파싱 (YYYY-MM-DD 형식)
    const parseDate = (dateString) => {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day); // month는 0부터 시작
    };
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const expiryDateOnly = parseDate(foodItem.expirationDate);
    
    // 유통기한이 이미 지났으면 알림 예약하지 않음
    if (expiryDateOnly <= today) {
      return null;
    }

    // 중복 알림 방지를 위한 키 생성
    const duplicateKey = `expiry_${foodItem.id}`;
    const lastNotificationTime = await AsyncStorage.getItem(duplicateKey);
    
    // 같은 음식에 대해 24시간 내에 이미 알림을 보냈다면 스킵
    if (lastNotificationTime) {
      const timeDiff = now.getTime() - parseInt(lastNotificationTime);
      if (timeDiff < 24 * 60 * 60 * 1000) { // 24시간
        console.log(`중복 유통기한 알림 방지: ${foodItem.name}`);
        return null;
      }
    }

    console.log(`유통기한 알림 계산: ${foodItem.name}`);
    console.log(`유통기한: ${foodItem.expirationDate}`);
    console.log(`오늘: ${today.toISOString().split('T')[0]}`);
    console.log(`설정된 알림일: ${settings.expiryDays}`);
    
    // 현재 날짜로부터 가장 가까운 알림 시점 찾기
    let closestNotification = null;
    let closestDays = Infinity;

    for (const days of settings.expiryDays) {
      // 더 안전한 날짜 계산: 밀리초 단위로 계산 후 날짜로 변환
      const triggerTime = expiryDateOnly.getTime() - (days * 24 * 60 * 60 * 1000);
      const triggerDate = new Date(triggerTime);
      
      // 날짜만 비교하기 위해 시간을 00:00:00으로 설정
      const triggerDateOnly = new Date(triggerDate.getFullYear(), triggerDate.getMonth(), triggerDate.getDate());
      
      console.log(`${days}일 전 알림 시점: ${triggerDateOnly.toISOString().split('T')[0]}`);
      
      // 과거 시간이면 스킵
      if (triggerDateOnly <= today) {
        console.log(`과거 시간이므로 스킵: ${days}일 전`);
        continue;
      }

      const daysUntilTrigger = Math.ceil((triggerDateOnly - today) / (1000 * 60 * 60 * 24));
      console.log(`알림까지 남은 일수: ${daysUntilTrigger}일`);
      
      // 가장 가까운 시점 찾기
      if (daysUntilTrigger < closestDays) {
        closestDays = daysUntilTrigger;
        closestNotification = {
          days,
          triggerDate: triggerDateOnly,
          title: days === 0 ? '유통기한 만료 알림' : '유통기한 임박 알림',
          body: days === 0 
            ? `${foodItem.name}의 유통기한이 오늘입니다.`
            : `${foodItem.name}의 유통기한이 ${days}일 남았습니다.`
        };
        console.log(`가장 가까운 알림으로 설정: ${days}일 전`);
      }
    }

    const scheduledNotifications = [];

    // 가장 가까운 알림만 예약
    if (closestNotification) {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: closestNotification.title,
          body: closestNotification.body,
          data: { 
            type: 'expiry',
            foodId: foodItem.id,
            foodName: foodItem.name,
            daysLeft: closestNotification.days
          },
          sound: settings.soundEnabled === true,
          vibrationPattern: settings.vibrationEnabled ? [0, 250, 250, 250] : undefined,
        },
        trigger: {
          date: closestNotification.triggerDate,
        },
      });

      // 알림 히스토리는 실제 발송 시에만 저장 (스케줄링 시에는 저장하지 않음)
      scheduledNotifications.push({
        id: identifier,
        foodId: foodItem.id,
        type: 'expiry',
        scheduledDate: triggerDate,
        daysLeft: closestNotification.days
      });

      console.log(`유통기한 알림 예약 성공: ${foodItem.name} - ${closestNotification.days}일 전 (${closestNotification.triggerDate.toISOString().split('T')[0]})`);
    } else {
      console.log(`예약할 유통기한 알림이 없음: ${foodItem.name}`);
    }

    // 중복 방지를 위한 타임스탬프 저장
    if (scheduledNotifications.length > 0) {
      await AsyncStorage.setItem(duplicateKey, now.getTime().toString());
    }

    // 예약된 알림 정보를 AsyncStorage에 저장
    await saveScheduledNotifications(foodItem.id, scheduledNotifications);

    return scheduledNotifications;
  } catch (error) {
    console.error('유통기한 알림 예약 실패:', error);
    return null;
  }
}

// 유통기한 알림 발송 후 다음 알림 예약
export async function scheduleNextExpiryNotification(foodItem, currentDaysLeft) {
  try {
    const settings = await loadNotificationSettings();
    
    // 유통기한 알림이 비활성화되어 있으면 스킵
    if (!settings.expiryEnabled) {
      return null;
    }

    // 날짜 문자열을 안전하게 파싱 (YYYY-MM-DD 형식)
    const parseDate = (dateString) => {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day); // month는 0부터 시작
    };
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const expiryDateOnly = parseDate(foodItem.expirationDate);
    
    // 유통기한이 이미 지났으면 알림 예약하지 않음
    if (expiryDateOnly <= today) {
      return null;
    }

    // 현재 알림보다 더 가까운 시점의 알림 찾기
    const remainingNotifications = settings.expiryDays
      .filter(days => days < currentDaysLeft) // 현재보다 더 가까운 시점만
      .sort((a, b) => b - a); // 큰 수부터 정렬 (가장 가까운 시점이 마지막)

    if (remainingNotifications.length === 0) {
      return null; // 더 이상 예약할 알림이 없음
    }

    // 다음 알림 시점 (가장 가까운 시점)
    const nextDays = remainingNotifications[0];
    
    // 더 안전한 날짜 계산: 밀리초 단위로 계산 후 날짜로 변환
    const triggerTime = expiryDateOnly.getTime() - (nextDays * 24 * 60 * 60 * 1000);
    const triggerDate = new Date(triggerTime);
    
    // 날짜만 비교하기 위해 시간을 00:00:00으로 설정
    const triggerDateOnly = new Date(triggerDate.getFullYear(), triggerDate.getMonth(), triggerDate.getDate());
    
    // 과거 시간이면 스킵
    if (triggerDateOnly <= today) {
      return null;
    }

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: nextDays === 0 ? '유통기한 만료 알림' : '유통기한 임박 알림',
        body: nextDays === 0 
          ? `${foodItem.name}의 유통기한이 오늘입니다.`
          : `${foodItem.name}의 유통기한이 ${nextDays}일 남았습니다.`,
        data: { 
          type: 'expiry',
          foodId: foodItem.id,
          foodName: foodItem.name,
          daysLeft: nextDays
        },
        sound: settings.soundEnabled === true,
        vibrationPattern: settings.vibrationEnabled ? [0, 250, 250, 250] : undefined,
      },
        trigger: {
          date: triggerDateOnly,
        },
    });

    console.log(`다음 유통기한 알림 예약됨: ${foodItem.name} - ${nextDays}일 전`);
    return identifier;
  } catch (error) {
    console.error('다음 유통기한 알림 예약 실패:', error);
    return null;
  }
}

// 재고 부족 알림 예약
export async function scheduleStockNotification(foodItem) {
  try {
    const settings = await loadNotificationSettings();
    
    // 재고 알림이 비활성화되어 있으면 스킵
    if (!settings.stockEnabled) {
      console.log('재고 알림이 비활성화되어 있습니다.');
      return null;
    }

    // 우선순위 모드가 silent이면 스킵
    if (settings.priorityMode === 'silent') {
      console.log('알림 우선순위가 조용함 모드입니다.');
      return null;
    }

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
        sound: settings.soundEnabled === true,
        vibrationPattern: settings.vibrationEnabled ? [0, 250, 250, 250] : undefined,
      },
      trigger: {
        seconds: 1, // 즉시 알림
      },
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

// 알림 취소 함수들

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
    
    // AsyncStorage에서 알림 관련 데이터도 정리
    const keys = await AsyncStorage.getAllKeys();
    const notificationKeys = keys.filter(key => 
      key.startsWith('expiry_') || 
      key.startsWith('stock_') || 
      key.startsWith('scheduled_notifications_') ||
      key.startsWith('recent_stock_notification_')
    );
    
    if (notificationKeys.length > 0) {
      await AsyncStorage.multiRemove(notificationKeys);
      console.log(`${notificationKeys.length}개의 알림 관련 데이터가 정리되었습니다.`);
    }
    
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
      smartEnabled: true,
      recipeEnabled: true,
      expiryDays: [3, 1, 0], // 3일 전, 1일 전, 당일
      dailyTime: '09:00', // 오전 9시
      stockThreshold: 2, // 재고 부족 임계값
      smartThreshold: 5, // 스마트 알림 임계값
      quietHours: { start: '22:00', end: '08:00' }, // 방해 금지 시간
      priorityMode: 'normal', // normal, urgent, silent
      vibrationEnabled: true,
      soundEnabled: true
    };
  } catch (error) {
    console.error('알림 설정 불러오기 실패:', error);
    return {
      expiryEnabled: true,
      stockEnabled: true,
      expiryDays: [3, 1, 0],
      stockThreshold: 2,
      quietHours: { start: '22:00', end: '08:00' },
      priorityMode: 'normal',
      vibrationEnabled: true,
      soundEnabled: true
    };
  }
}

