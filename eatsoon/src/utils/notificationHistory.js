// src/utils/notificationHistory.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from 'firebase/auth';

// 샘플 알림 데이터 생성 (테스트용)
export function createSampleNotifications() {
  const now = new Date();
  return [
    {
      id: '1',
      timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), // 1일 전
      type: 'expiry',
      title: '유통기한 임박 알림',
      body: '우유의 유통기한이 3일 남았습니다.',
      data: { foodId: '1', foodName: '우유', daysLeft: 3 },
      read: false,
    },
    {
      id: '2',
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2일 전
      type: 'stock',
      title: '재고 부족 알림',
      body: '사과의 재고가 부족합니다. (1개 남음)',
      data: { foodId: '2', foodName: '사과', quantity: 1 },
      read: true,
    },
    {
      id: '3',
      timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3일 전
      type: 'daily',
      title: 'EatSoon 일일 알림',
      body: '오늘의 음식 재고를 확인해보세요!',
      data: { type: 'daily' },
      read: false,
    },
    {
      id: '4',
      timestamp: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4일 전
      type: 'expiry',
      title: '유통기한 만료 알림',
      body: '요거트의 유통기한이 오늘입니다.',
      data: { foodId: '3', foodName: '요거트', daysLeft: 0 },
      read: true,
    },
    {
      id: '5',
      timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5일 전
      type: 'stock',
      title: '재고 부족 알림',
      body: '계란의 재고가 부족합니다. (2개 남음)',
      data: { foodId: '4', foodName: '계란', quantity: 2 },
      read: false,
    },
  ];
};

// 알림 히스토리 저장
export async function saveNotificationHistory(notification) {
  try {
    const user = getAuth().currentUser;
    if (!user) return;

    const key = `notificationHistory_${user.uid}`;
    const existingHistory = await getNotificationHistory();
    
    // 타입 필드가 확실히 설정되도록 보장
    const notificationType = notification.type || 'unknown';
    
    const newHistory = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type: notificationType,
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      read: false,
      ...notification
    };

    console.log('[DEBUG] 저장할 알림:', {
      type: newHistory.type,
      title: newHistory.title,
      body: newHistory.body
    });

    // 최신 알림을 맨 앞에 추가 (최대 100개 유지)
    const updatedHistory = [newHistory, ...existingHistory].slice(0, 100);
    
    await AsyncStorage.setItem(key, JSON.stringify(updatedHistory));
    console.log('알림 히스토리가 저장되었습니다.');
  } catch (error) {
    console.error('알림 히스토리 저장 실패:', error);
  }
}

// 알림 히스토리 불러오기
export async function getNotificationHistory() {
  try {
    const user = getAuth().currentUser;
    if (!user) return [];

    const key = `notificationHistory_${user.uid}`;
    const data = await AsyncStorage.getItem(key);
    
    if (data) {
      const history = JSON.parse(data);
      console.log('[DEBUG] 불러온 알림 히스토리:', {
        개수: history.length,
        타입별_분포: history.reduce((acc, n) => {
          acc[n.type] = (acc[n.type] || 0) + 1;
          return acc;
        }, {})
      });
      return history;
    } else {
      // 데이터가 없으면 빈 배열 반환 (샘플 데이터 생성하지 않음)
      console.log('[DEBUG] 알림 히스토리가 비어있음');
      return [];
    }
  } catch (error) {
    console.error('알림 히스토리 불러오기 실패:', error);
    return [];
  }
}

// 알림 읽음 처리
export async function markNotificationAsRead(notificationId) {
  try {
    const user = getAuth().currentUser;
    if (!user) return;

    const key = `notificationHistory_${user.uid}`;
    const history = await getNotificationHistory();
    
    const updatedHistory = history.map(notification => 
      notification.id === notificationId 
        ? { ...notification, read: true }
        : notification
    );
    
    await AsyncStorage.setItem(key, JSON.stringify(updatedHistory));
    console.log('알림이 읽음 처리되었습니다.');
  } catch (error) {
    console.error('알림 읽음 처리 실패:', error);
  }
}

// 모든 알림 읽음 처리
export async function markAllNotificationsAsRead() {
  try {
    const user = getAuth().currentUser;
    if (!user) return;

    const key = `notificationHistory_${user.uid}`;
    const history = await getNotificationHistory();
    
    const updatedHistory = history.map(notification => ({
      ...notification,
      read: true
    }));
    
    await AsyncStorage.setItem(key, JSON.stringify(updatedHistory));
    console.log('모든 알림이 읽음 처리되었습니다.');
  } catch (error) {
    console.error('모든 알림 읽음 처리 실패:', error);
  }
}

// 알림 삭제
export async function deleteNotification(notificationId) {
  try {
    const user = getAuth().currentUser;
    if (!user) return;

    const key = `notificationHistory_${user.uid}`;
    const history = await getNotificationHistory();
    
    const updatedHistory = history.filter(notification => 
      notification.id !== notificationId
    );
    
    await AsyncStorage.setItem(key, JSON.stringify(updatedHistory));
    console.log('알림이 삭제되었습니다.');
  } catch (error) {
    console.error('알림 삭제 실패:', error);
  }
}

// 모든 알림 삭제
export async function clearAllNotifications() {
  try {
    const user = getAuth().currentUser;
    if (!user) return;

    const key = `notificationHistory_${user.uid}`;
    await AsyncStorage.removeItem(key);
    console.log('모든 알림이 삭제되었습니다.');
  } catch (error) {
    console.error('모든 알림 삭제 실패:', error);
  }
}

// 읽지 않은 알림 개수 가져오기
export async function getUnreadNotificationCount() {
  try {
    const history = await getNotificationHistory();
    return history.filter(notification => !notification.read).length;
  } catch (error) {
    console.error('읽지 않은 알림 개수 가져오기 실패:', error);
    return 0;
  }
}

// 알림 타입별 필터링
export function filterNotificationsByType(notifications, type) {
  if (!type || type === 'all') return notifications;
  
  console.log('[DEBUG] 필터링 시작:', {
    요청된_타입: type,
    전체_알림_개수: notifications.length,
    알림_타입들: notifications.map(n => n.type)
  });
  
  const filtered = notifications.filter(notification => {
    const notificationType = notification.type || 'unknown';
    const matches = notificationType === type;
    
    if (!matches) {
      console.log('[DEBUG] 필터링 제외:', {
        알림_ID: notification.id,
        알림_타입: notificationType,
        요청된_타입: type,
        제목: notification.title
      });
    }
    
    return matches;
  });
  
  console.log('[DEBUG] 필터링 결과:', {
    필터링된_알림_개수: filtered.length,
    필터링된_알림들: filtered.map(n => ({ type: n.type, title: n.title }))
  });
  
  return filtered;
}

// 알림 날짜별 그룹화
export function groupNotificationsByDate(notifications) {
  const groups = {};
  
  notifications.forEach(notification => {
    const date = new Date(notification.timestamp).toLocaleDateString('ko-KR');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(notification);
  });
  
  return Object.entries(groups).map(([date, notifications]) => ({
    date,
    notifications
  }));
}

// 샘플 데이터 초기화 (개발/테스트용)
export async function initializeSampleNotifications() {
  try {
    const user = getAuth().currentUser;
    if (!user) return;

    const key = `notificationHistory_${user.uid}`;
    const sampleData = createSampleNotifications();
    await AsyncStorage.setItem(key, JSON.stringify(sampleData));
    console.log('[DEBUG] 샘플 데이터가 초기화되었습니다.');
    return sampleData;
  } catch (error) {
    console.error('샘플 데이터 초기화 실패:', error);
    return [];
  }
}
