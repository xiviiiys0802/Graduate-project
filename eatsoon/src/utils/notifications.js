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
// 공통 스케줄러: 플랫폼/Expo 권장 포맷으로 안전하게 예약
async function scheduleAtDate(dateOrNull, content, fireNow = false) {
  try {
    if (fireNow || !dateOrNull) {
      return await Notifications.scheduleNotificationAsync({
        content,
        trigger: { seconds: 1 },
      });
    }

    const trigger = { type: 'date', date: dateOrNull };
    return await Notifications.scheduleNotificationAsync({ content, trigger });
  } catch (e) {
    console.error('알림 스케줄 실패:', e?.message || e);
    // 폴백: 날짜 객체 직접 전달 (Expo Go 등 환경 차이 대응)
    try {
      return await Notifications.scheduleNotificationAsync({
        content,
        trigger: dateOrNull,
      });
    } catch (e2) {
      console.error('알림 스케줄 폴백도 실패:', e2?.message || e2);
      return null;
    }
  }
}

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

// 공통: 다양한 날짜 입력을 안전하게 Date로 변환
function parseAnyDate(input) {
  if (!input) return null;
  if (input instanceof Date) return new Date(input.getFullYear(), input.getMonth(), input.getDate());
  if (typeof input === 'number') return new Date(input);
  const s = String(input);
  // ISO like "2025-09-23" or "2025-09-23T12:34:56.000Z"
  if (s.includes('T')) {
    const d = new Date(s);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  const parts = s.split('-').map(Number);
  if (parts.length >= 3) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

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

    // 알림 시간 설정 파싱 (예: '09:00')
    const [hh, mm] = String(settings.dailyTime || '09:00').split(':').map(v => parseInt(v, 10));

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const expiryDateOnly = parseAnyDate(foodItem.expirationDate);
    if (!expiryDateOnly || isNaN(expiryDateOnly.getTime())) {
      console.log('유통기한 날짜 파싱 실패로 예약 스킵:', foodItem.name, foodItem.expirationDate);
      return null;
    }
    
    // 유통기한이 이미 지났으면 알림 예약하지 않음 (당일은 허용)
    if (expiryDateOnly < today) {
      return null;
    }

    // 기존 예약 제거(중복 방지)
    await cancelFoodNotifications(foodItem.id);

    // 중복 알림 방지 키 (즉시 발송 시에만 적용)
    const duplicateKey = `expiry_${foodItem.id}`;
    const lastNotificationTime = await AsyncStorage.getItem(duplicateKey);

    console.log(`유통기한 알림 계산: ${foodItem.name}`);
    console.log(`유통기한: ${foodItem.expirationDate}`);
    console.log(`오늘: ${today.toISOString().split('T')[0]}`);
    console.log(`설정된 알림일: ${settings.expiryDays}`);
    
    // 현재 날짜로부터 가장 가까운 알림 시점 찾기
    let closestNotification = null;
    let closestDays = Infinity;

    for (const days of settings.expiryDays) {
      // 목표 날짜 계산 후 사용자가 설정한 시간으로 맞춤
      const target = new Date(expiryDateOnly.getTime() - (days * 24 * 60 * 60 * 1000));
      const triggerDateOnly = new Date(target.getFullYear(), target.getMonth(), target.getDate(), hh || 9, mm || 0, 0, 0);
      
      console.log(`${days}일 전 알림 시점: ${triggerDateOnly.toISOString().split('T')[0]}`);
      
      const isSameDay = triggerDateOnly.getFullYear() === now.getFullYear() && triggerDateOnly.getMonth() === now.getMonth() && triggerDateOnly.getDate() === now.getDate();
      const isPastNow = triggerDateOnly.getTime() <= now.getTime();
      // 오늘이고 설정 시각을 이미 지나쳤다면, 즉시 알림 대상으로 간주
      if (!isSameDay && isPastNow) {
        console.log(`과거 시간이므로 스킵: ${days}일 전`);
        continue;
      }

      const daysUntilTrigger = Math.ceil((new Date(triggerDateOnly.getFullYear(), triggerDateOnly.getMonth(), triggerDateOnly.getDate()) - today) / (1000 * 60 * 60 * 24));
      console.log(`알림까지 남은 일수: ${daysUntilTrigger}일`);
      
      // 가장 가까운 시점 찾기
      if (daysUntilTrigger < closestDays) {
        closestDays = daysUntilTrigger;
        closestNotification = {
          days,
          triggerDate: triggerDateOnly,
          fireNow: isSameDay && isPastNow,
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
      // 즉시 발송 중복 방지 (마지막 발송에서 24시간 이내면 스킵)
      if (closestNotification.fireNow && lastNotificationTime) {
        const timeDiff = now.getTime() - parseInt(lastNotificationTime);
        if (timeDiff < 24 * 60 * 60 * 1000) {
          console.log(`중복 유통기한 알림 방지(즉시): ${foodItem.name}`);
          return null;
        }
      }

      const content = {
        title: closestNotification.title,
        body: closestNotification.body,
        data: {
          type: 'expiry',
          foodId: foodItem.id,
          foodName: foodItem.name,
          daysLeft: closestNotification.days,
        },
        sound: settings.soundEnabled === true,
        vibrationPattern: settings.vibrationEnabled ? [0, 250, 250, 250] : undefined,
      };

      const identifier = await scheduleAtDate(
        closestNotification.fireNow ? null : closestNotification.triggerDate,
        content,
        closestNotification.fireNow,
      );

      // 알림 히스토리는 실제 발송 시에만 저장 (스케줄링 시에는 저장하지 않음)
      scheduledNotifications.push({
        id: identifier,
        foodId: foodItem.id,
        type: 'expiry',
        scheduledDate: closestNotification.triggerDate,
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

    const [hh, mm] = String(settings.dailyTime || '09:00').split(':').map(v => parseInt(v, 10));
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const expiryDateOnly = parseAnyDate(foodItem.expirationDate);
    
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
    const target = new Date(expiryDateOnly.getTime() - (nextDays * 24 * 60 * 60 * 1000));
    const triggerDateOnly = new Date(target.getFullYear(), target.getMonth(), target.getDate(), hh || 9, mm || 0, 0, 0);
    
    // 과거 시간이면 스킵
    if (triggerDateOnly.getTime() <= now.getTime()) {
      return null;
    }

    const identifier = await scheduleAtDate(
      triggerDateOnly,
      {
        title: nextDays === 0 ? '유통기한 만료 알림' : '유통기한 임박 알림',
        body: nextDays === 0
          ? `${foodItem.name}의 유통기한이 오늘입니다.`
          : `${foodItem.name}의 유통기한이 ${nextDays}일 남았습니다.`,
        data: {
          type: 'expiry',
          foodId: foodItem.id,
          foodName: foodItem.name,
          daysLeft: nextDays,
        },
        sound: settings.soundEnabled === true,
        vibrationPattern: settings.vibrationEnabled ? [0, 250, 250, 250] : undefined,
      },
      false,
    );

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

