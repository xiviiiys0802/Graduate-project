// src/utils/notification.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { auth } from '../config/firebase'; // Firebase 초기화 파일
import { Linking } from 'react-native';


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
  }

  return token;
}

