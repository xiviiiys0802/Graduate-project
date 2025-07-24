import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { getAuth } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';

export default function SettingsScreen() {
  const [userInfo, setUserInfo] = useState(null);
  const navigation = useNavigation();  // ← 추가

  useEffect(() => {
    registerForPushNotificationsAsync();
    // Firebase Auth에서 사용자 정보 가져오기
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      setUserInfo({
        name: user.displayName || '닉네임 없음',
        email: user.email,
        photo: user.photoURL,
      });
    }
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

      {/* 섹션 구분 */}
      <Text style={styles.sectionTitle}>시스템 설정</Text>

      {/* 알림 설정 화면으로 이동 */}
      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('NotificationSettings')}>
        <Text>알림</Text>
      </TouchableOpacity>
      <Button
        title="알림 테스트"
        onPress={async () => {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'EatSoon 알림',
              body: '테스트 알림이 도착했습니다!',
            },
            trigger: { seconds: 2 },
          });
        }}
      />

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
});
