import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { getAuth } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { registerForPushNotificationsAsync } from '../utils/notifications';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function SettingsScreen() {
  const [userInfo, setUserInfo] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    registerForPushNotificationsAsync();
    const listener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📩 포그라운드 알림:', notification);
    });

    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      setUserInfo({
        name: user.displayName || '닉네임 없음',
        email: user.email,
        photo: user.photoURL,
      });
    }
    return () => listener.remove();
  }, []);

  return (
    <ScrollView style={styles.container}>
      {/* 프로필 카드 */}
      <TouchableOpacity style={styles.profileCard}>
        {userInfo?.photo ? (
          <Image source={{ uri: userInfo.photo }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder} />
        )}
        <View>
          <Text style={styles.name}>{userInfo?.name}</Text>
          <Text style={styles.email}>{userInfo?.email}</Text>
          <Text style={styles.sub}>계정, 개인/보안 등</Text>
        </View>
      </TouchableOpacity>

      {/* 새로운 기능 섹션 */}
      <Text style={styles.sectionTitle}>기능</Text>

      <TouchableOpacity style={styles.recipeBox} onPress={() => navigation.navigate('RecipeRecommendation')}>
        <Text style={styles.recipeText}>레시피 추천</Text>
      </TouchableOpacity>

      <View style={styles.bottomRow}>
        <TouchableOpacity style={styles.leftBox} onPress={() => navigation.navigate('StatisticsReport')}>
          <Text>통계/리포트</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.rightBox} onPress={() => navigation.navigate('ShoppingList')}>
          <Text>장보기 리스트</Text>
        </TouchableOpacity>
      </View>

      {/* 기존 시스템 설정 */}
      <Text style={styles.sectionTitle}>시스템 설정</Text>

      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('NotificationSettings')}>
        <Text>알림</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem}>
        <Text>앱 사용 분석 (준비 중)</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>기타</Text>

      <TouchableOpacity style={styles.menuItem}>
        <Text>로그아웃</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    margin: 16,
    borderRadius: 12,
    backgroundColor: '#f2f2f2',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
    backgroundColor: '#ccc',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  email: {
    color: 'gray',
  },
  sub: {
    color: 'gray',
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  recipeBox: {
    height: 150,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: '#ffe0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeText: {
    fontSize: 18,
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  leftBox: {
    flex: 1,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#d0f0ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightBox: {
    flex: 1,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#d0ffd0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
