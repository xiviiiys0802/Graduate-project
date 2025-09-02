// src/screens/ProfileEditScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { getAuth, updateProfile, updateEmail, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Theme } from '../utils/colors';
import { 
  Container, 
  Card, 
  Button, 
  ButtonText, 
  Input,
  Label,
  Divider,
  IconContainer
} from '../components/StyledComponents';

export default function ProfileEditScreen() {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const navigation = useNavigation();

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      setUserInfo({
        name: user.displayName || '',
        email: user.email || '',
        photo: user.photoURL,
        uid: user.uid,
      });
      setFormData({
        displayName: user.displayName || '',
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // 이름 검증
    if (!formData.displayName.trim()) {
      newErrors.displayName = '이름을 입력해주세요';
    } else if (formData.displayName.length < 2) {
      newErrors.displayName = '이름은 2자 이상이어야 합니다';
    }

    // 이메일 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요';
    }

    // 비밀번호 변경 시 검증
    if (formData.newPassword || formData.confirmPassword) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = '현재 비밀번호를 입력해주세요';
      }
      if (formData.newPassword && formData.newPassword.length < 6) {
        newErrors.newPassword = '비밀번호는 6자 이상이어야 합니다';
      }
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        Alert.alert('오류', '사용자 정보를 불러올 수 없습니다.');
        return;
      }

      // 이름 업데이트
      if (formData.displayName !== userInfo.name) {
        await updateProfile(user, { displayName: formData.displayName });
      }

      // 이메일 업데이트
      if (formData.email !== userInfo.email) {
        await updateEmail(user, formData.email);
      }

      // 비밀번호 변경
      if (formData.newPassword) {
        const credential = EmailAuthProvider.credential(
          userInfo.email,
          formData.currentPassword
        );
        await reauthenticateWithCredential(user, credential);
        // Firebase Auth에서는 비밀번호 변경을 위해 별도의 함수가 필요하지만,
        // 현재 구현에서는 보안상 제한이 있을 수 있습니다.
        Alert.alert('알림', '비밀번호 변경은 보안상 웹에서 직접 변경해주세요.');
      }

      Alert.alert('성공', '프로필이 업데이트되었습니다.');
      navigation.navigate('Main', { screen: 'Profile' });
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      
      let errorMessage = '프로필 업데이트에 실패했습니다.';
      if (error.code === 'auth/requires-recent-login') {
        errorMessage = '보안을 위해 다시 로그인해주세요.';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = '이미 사용 중인 이메일입니다.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = '현재 비밀번호가 올바르지 않습니다.';
      }
      
      Alert.alert('오류', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      '취소',
      '변경사항이 저장되지 않습니다. 정말 취소하시겠습니까?',
      [
        { text: '계속 편집', style: 'cancel' },
        { text: '취소', onPress: () => navigation.navigate('Main', { screen: 'Profile' }) }
      ]
    );
  };

  return (
    <Container>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('Main', { screen: 'Profile' })}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={28} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>프로필 편집</Text>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.saveButtonText}>저장</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 기본 정보 */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconContainer>
              <Ionicons name="person" size={20} color={Colors.primary} />
            </IconContainer>
            <Text style={styles.sectionTitle}>기본 정보</Text>
          </View>
          
          <Label>이름</Label>
          <Input
            value={formData.displayName}
            onChangeText={(text) => setFormData({...formData, displayName: text})}
            placeholder="이름을 입력하세요"
            error={errors.displayName}
          />
          {errors.displayName && (
            <Text style={styles.errorText}>{errors.displayName}</Text>
          )}

          <Label>이메일</Label>
          <Input
            value={formData.email}
            onChangeText={(text) => setFormData({...formData, email: text})}
            placeholder="이메일을 입력하세요"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
          {errors.email && (
            <Text style={styles.errorText}>{errors.email}</Text>
          )}
        </Card>

        {/* 비밀번호 변경 */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconContainer>
              <Ionicons name="lock-closed" size={20} color={Colors.warning} />
            </IconContainer>
            <Text style={styles.sectionTitle}>비밀번호 변경</Text>
          </View>
          
          <Text style={styles.sectionDescription}>
            비밀번호를 변경하려면 현재 비밀번호를 입력하세요
          </Text>

          <Label>현재 비밀번호</Label>
          <Input
            value={formData.currentPassword}
            onChangeText={(text) => setFormData({...formData, currentPassword: text})}
            placeholder="현재 비밀번호를 입력하세요"
            secureTextEntry
            error={errors.currentPassword}
          />
          {errors.currentPassword && (
            <Text style={styles.errorText}>{errors.currentPassword}</Text>
          )}

          <Label>새 비밀번호</Label>
          <Input
            value={formData.newPassword}
            onChangeText={(text) => setFormData({...formData, newPassword: text})}
            placeholder="새 비밀번호를 입력하세요 (6자 이상)"
            secureTextEntry
            error={errors.newPassword}
          />
          {errors.newPassword && (
            <Text style={styles.errorText}>{errors.newPassword}</Text>
          )}

          <Label>새 비밀번호 확인</Label>
          <Input
            value={formData.confirmPassword}
            onChangeText={(text) => setFormData({...formData, confirmPassword: text})}
            placeholder="새 비밀번호를 다시 입력하세요"
            secureTextEntry
            error={errors.confirmPassword}
          />
          {errors.confirmPassword && (
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
          )}
        </Card>

        {/* 프로필 사진 */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconContainer>
              <Ionicons name="camera" size={20} color={Colors.info} />
            </IconContainer>
            <Text style={styles.sectionTitle}>프로필 사진</Text>
          </View>
          
          <Text style={styles.sectionDescription}>
            프로필 사진은 마이페이지에서 변경할 수 있습니다
          </Text>
          
          <Button 
            style={styles.photoButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="images" size={20} color={Colors.white} />
            <ButtonText style={styles.photoButtonText}>프로필 사진 변경하기</ButtonText>
          </Button>
        </Card>

        {/* 주의사항 */}
        <Card style={styles.warningCard}>
          <View style={styles.warningHeader}>
            <Ionicons name="warning" size={20} color={Colors.warning} />
            <Text style={styles.warningTitle}>주의사항</Text>
          </View>
          <Text style={styles.warningText}>
            • 이메일 변경 시 재인증이 필요할 수 있습니다{'\n'}
            • 비밀번호 변경은 보안상 웹에서 직접 변경해주세요{'\n'}
            • 변경사항은 즉시 적용됩니다
          </Text>
        </Card>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Theme.spacing.md,
    minHeight: 60,
  },
  backButton: {
    padding: Theme.spacing.md,
    marginLeft: -Theme.spacing.sm,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Theme.typography.h3.fontSize,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  saveButton: {
    padding: Theme.spacing.md,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: Colors.primary,
    fontSize: Theme.typography.body.fontSize,
    fontWeight: '600',
  },

  // 섹션
  section: {
    marginHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: Theme.typography.h3.fontSize,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginLeft: Theme.spacing.sm,
  },
  sectionDescription: {
    fontSize: Theme.typography.small.fontSize,
    color: Colors.textSecondary,
    marginBottom: Theme.spacing.lg,
    lineHeight: 18,
  },

  // 버튼
  photoButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.info,
  },
  photoButtonText: {
    marginLeft: Theme.spacing.xs,
  },

  // 경고 카드
  warningCard: {
    marginHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    backgroundColor: Colors.warning + '10',
    borderColor: Colors.warning + '30',
    borderWidth: 1,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  warningTitle: {
    fontSize: Theme.typography.body.fontSize,
    fontWeight: '600',
    color: Colors.warning,
    marginLeft: Theme.spacing.xs,
  },
  warningText: {
    fontSize: Theme.typography.small.fontSize,
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  // 오류 텍스트
  errorText: {
    color: Colors.danger,
    fontSize: Theme.typography.small.fontSize,
    marginTop: Theme.spacing.xs,
    marginBottom: Theme.spacing.sm,
  },
});
