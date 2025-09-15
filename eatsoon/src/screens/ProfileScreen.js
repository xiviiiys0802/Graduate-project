// src/screens/ProfileScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  ToastAndroid,
  Alert,
  Platform,
} from 'react-native';
import { getAuth, signOut, updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { storage } from '../config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Theme } from '../utils/colors';
import StatisticsService from '../services/statisticsService';
import { useFocusEffect } from '@react-navigation/native';
import { 
  Container, 
  Card, 
  Button, 
  ButtonText, 
  SectionHeader,
  ListItem,
  IconContainer,
  Divider,
  Badge
} from '../components/StyledComponents';

export default function ProfileScreen() {
  const [userInfo, setUserInfo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      setUserInfo({
        name: user.displayName || '닉네임 없음',
        email: user.email,
        photo: user.photoURL,
        uid: user.uid, // 사진 업로드에 필요
      });
    }
    loadStatistics();
  }, []);

  // 화면이 포커스될 때마다 통계 새로고침
  useFocusEffect(
    React.useCallback(() => {
      loadStatistics();
    }, [])
  );

  const loadStatistics = async () => {
    try {
      const stats = await StatisticsService.getRealtimeSummary();
      setStatistics(stats);
    } catch (error) {
      console.error('통계 로드 실패:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);

      if (Platform.OS === 'android') {
        ToastAndroid.show('로그아웃 되었습니다', ToastAndroid.SHORT);
      } else {
        Alert.alert('로그아웃', '로그아웃 되었습니다');
      }
      // user 상태가 null이 되면 App.js의 AuthProvider에서 자동으로 로그인 화면으로 이동됨
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  const pickAndUploadImage = async () => {
    try {
      // 권한 확인
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '사진을 선택하려면 갤러리 접근 권한이 필요합니다.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        await uploadImageToFirebase(imageUri);
      }
    } catch (error) {
      console.error('[ERROR] 이미지 선택 오류:', error);
      Alert.alert('오류', '이미지 선택에 실패했습니다.');
    }
  };

  const uploadImageToFirebase = async (uri) => {
    try {
      setUploading(true);

      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        Alert.alert('오류', '사용자 정보를 불러올 수 없습니다.');
        return;
      }

      console.log('[DEBUG] uri:', uri);
      
      // URI 유효성 검사
      if (!uri || uri === '') {
        throw new Error('유효하지 않은 이미지 URI');
      }

      // 이미지 크기 제한 (5MB)
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`이미지 다운로드 실패: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log('[DEBUG] blob created:', blob.size, 'bytes');
      
      // 파일 크기 체크 (5MB = 5 * 1024 * 1024 bytes)
      if (blob.size > 5 * 1024 * 1024) {
        throw new Error('이미지 크기가 너무 큽니다. 5MB 이하의 이미지를 선택해주세요.');
      }

      // 간단한 파일명 사용
      const fileName = `profile_${user.uid}.jpg`;
      const imageRef = ref(storage, fileName);
      console.log('[DEBUG] imageRef:', imageRef.fullPath);

      // 업로드 진행 (메타데이터 없이)
      console.log('[DEBUG] Starting upload...');
      await uploadBytes(imageRef, blob);
      console.log('[DEBUG] upload success');

      // 다운로드 URL 가져오기
      console.log('[DEBUG] Getting download URL...');
      const downloadURL = await getDownloadURL(imageRef);
      console.log('[DEBUG] downloadURL:', downloadURL);

      // Firebase Auth 프로필 업데이트
      console.log('[DEBUG] Updating profile...');
      await updateProfile(user, { photoURL: downloadURL });

      // 로컬 상태 업데이트
      setUserInfo(prev => ({ ...prev, photo: downloadURL }));
      
      Alert.alert('성공', '프로필 사진이 업데이트되었습니다.');
    } catch (error) {
      console.error('[ERROR] 업로드 오류:', error);
      console.error('[ERROR] Error code:', error.code);
      console.error('[ERROR] Error message:', error.message);
      
      // 사용자 친화적인 오류 메시지
      let errorMessage = '사진 업로드에 실패했습니다.';
      
      if (error.code === 'storage/unauthorized') {
        errorMessage = 'Firebase Storage 권한이 없습니다. Firebase Console에서 Storage 규칙을 확인해주세요.';
      } else if (error.code === 'storage/quota-exceeded') {
        errorMessage = '저장 공간이 부족합니다.';
      } else if (error.code === 'storage/unauthenticated') {
        errorMessage = '인증이 필요합니다. 다시 로그인해주세요.';
      } else if (error.message.includes('크기')) {
        errorMessage = error.message;
      } else if (error.message.includes('네트워크')) {
        errorMessage = '네트워크 연결을 확인해주세요.';
      } else if (error.code === 'storage/unknown') {
        errorMessage = 'Firebase Storage 서버 오류가 발생했습니다. Firebase Console에서 Storage가 활성화되어 있는지 확인해주세요.';
      }
      
      Alert.alert('오류', errorMessage);
    } finally {
      setUploading(false);
    }
  };



  return (
    <Container>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 프로필 헤더 */}
        <Card style={styles.profileCard}>
          <TouchableOpacity 
            style={styles.profileHeader} 
            onPress={pickAndUploadImage}
            activeOpacity={0.8}
          >
            <View style={styles.avatarContainer}>
              {uploading ? (
                <ActivityIndicator size="large" color={Colors.primary} />
              ) : userInfo?.photo ? (
                <Image source={{ uri: userInfo.photo }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={32} color={Colors.textSecondary} />
                </View>
              )}
              <View style={styles.editBadge}>
                <Ionicons name="camera" size={12} color={Colors.white} />
              </View>
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{userInfo?.name}</Text>
              <Text style={styles.email}>{userInfo?.email}</Text>
              <Text style={styles.editHint}>탭하여 사진 변경</Text>
            </View>
          </TouchableOpacity>
        </Card>

        {/* 통계 카드 */}
        <View style={styles.statsContainer}>
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>{statistics?.totalFoodItems || 0}</Text>
            <Text style={styles.statLabel}>등록된 음식</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => navigation.navigate('Home', { filter: 'expiring' })}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>{statistics?.expiringSoonItems || 0}</Text>
            <Text style={styles.statLabel}>유통기한 임박</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => navigation.navigate('Home', { screen: 'NotificationHistory' })}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>{statistics?.notificationsSent || 0}</Text>
            <Text style={styles.statLabel}>이번 주 알림</Text>
          </TouchableOpacity>
        </View>

        {/* 설정 메뉴 */}
        <SectionHeader>시스템 설정</SectionHeader>
        
        <Card style={styles.menuCard}>
          <ListItem
            onPress={() => navigation.navigate('NotificationSettings')}
            icon="notifications"
            title="알림 설정"
            subtitle="알림 시간과 종류를 설정하세요"
            rightIcon="chevron-forward"
          />
          <Divider />
          <ListItem
            onPress={() => navigation.navigate('Home', { screen: 'StatisticsReport' })}
            icon="analytics"
            title="사용 통계"
            subtitle="앱 사용 현황을 확인하세요"
            rightIcon="chevron-forward"
          />
          <Divider />
          <ListItem
            onPress={() => navigation.navigate('Home', { screen: 'NotificationHistory' })}
            icon="time"
            title="알림 히스토리"
            subtitle="받은 알림들을 확인하세요"
            rightIcon="chevron-forward"
          />
        </Card>

        {/* 계정 관리 */}
        <SectionHeader>계정 관리</SectionHeader>
        
        <Card style={styles.menuCard}>
          <ListItem
            onPress={() => navigation.navigate('Settings', { screen: 'ProfileEdit' })}
            icon="person"
            title="프로필 편집"
            subtitle="이름과 이메일을 변경하세요"
            rightIcon="chevron-forward"
          />
          <Divider />
          <ListItem
            onPress={() => navigation.navigate('Settings', { screen: 'Privacy' })}
            icon="shield-checkmark"
            title="개인정보 보호"
            subtitle="데이터 사용 현황을 확인하세요"
            rightIcon="chevron-forward"
          />
        </Card>

        {/* 앱 정보 */}
        <SectionHeader>앱 정보</SectionHeader>
        
        <Card style={styles.menuCard}>
          <ListItem
            onPress={() => Alert.alert('앱 정보', 'EatSoon v1.0.0\n식품 관리 앱')}
            icon="information-circle"
            title="버전 정보"
            subtitle="v1.0.0"
            rightIcon="chevron-forward"
          />
          <Divider />
          <ListItem
            onPress={() => navigation.navigate('Settings', { screen: 'Help' })}
            icon="help-circle"
            title="도움말"
            subtitle="사용 방법을 확인하세요"
            rightIcon="chevron-forward"
          />
        </Card>

        {/* 로그아웃 버튼 */}
        <Button 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.white} />
          <ButtonText style={styles.logoutText}>로그아웃</ButtonText>
        </Button>

        {/* 앱 버전 */}
        <Text style={styles.versionText}>EatSoon v1.0.0</Text>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  // 프로필 카드
  profileCard: {
    marginHorizontal: Theme.spacing.md,
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.md,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: Theme.spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.small,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: Theme.typography.h3.fontSize,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.xs,
  },
  email: {
    fontSize: Theme.typography.body.fontSize,
    color: Colors.textSecondary,
    marginBottom: Theme.spacing.xs,
  },
  editHint: {
    fontSize: Theme.typography.small.fontSize,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },

  // 통계 카드
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    marginHorizontal: Theme.spacing.xs,
    padding: Theme.spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.lg,
    ...Theme.shadows.small,
  },
  statNumber: {
    fontSize: Theme.typography.h2.fontSize,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Theme.spacing.xs,
  },
  statLabel: {
    fontSize: Theme.typography.small.fontSize,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // 메뉴 카드
  menuCard: {
    marginHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },

  // 로그아웃 버튼
  logoutButton: {
    marginHorizontal: Theme.spacing.md,
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
    backgroundColor: Colors.danger,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    marginLeft: Theme.spacing.xs,
  },

  // 버전 정보
  versionText: {
    textAlign: 'center',
    fontSize: Theme.typography.small.fontSize,
    color: Colors.textSecondary,
    marginBottom: Theme.spacing.xl,
  },
});
