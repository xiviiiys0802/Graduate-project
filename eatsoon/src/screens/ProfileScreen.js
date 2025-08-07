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
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';

export default function ProfileScreen() {
  const [userInfo, setUserInfo] = useState(null);
  const [uploading, setUploading] = useState(false);
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
  }, []);

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
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      await uploadImageToFirebase(imageUri);
    }
  };

  const uploadImageToFirebase = async (uri) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    try {
      setUploading(true);
      const response = await fetch(uri);
      const blob = await response.blob();
      const storage = getStorage();
      const filename = `profilePhotos/${user.uid}.jpg`;
      const imageRef = ref(storage, filename);

      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);

      await updateProfile(user, { photoURL: downloadURL });
      setUserInfo({ ...userInfo, photo: downloadURL });

      Alert.alert('성공', '프로필 사진이 업데이트되었습니다.');
    } catch (error) {
      console.error('업로드 오류:', error);
      Alert.alert('오류', '사진 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.profileCard} onPress={pickAndUploadImage}>
        {uploading ? (
          <ActivityIndicator size="large" color="#4f62c0" />
        ) : userInfo?.photo ? (
          <Image source={{ uri: userInfo.photo }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder} />
        )}
        <View>
          <Text style={styles.name}>{userInfo?.name}</Text>
          <Text style={styles.email}>{userInfo?.email}</Text>
          <Text style={styles.sub}>탭하여 사진 변경</Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>시스템 설정</Text>
      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('NotificationSettings')}>
        <Text>알림</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuItem}>
        <Text>앱 사용 분석 (준비 중)</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>기타</Text>
      <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
        <Text>로그아웃</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff' },
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
  name: { fontSize: 18, fontWeight: 'bold' },
  email: { color: 'gray' },
  sub: { color: 'gray', fontSize: 12, marginTop: 4 },
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
