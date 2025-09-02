// src/screens/PrivacyScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Theme } from '../utils/colors';
import { 
  Container, 
  Card, 
  Button, 
  ButtonText,
  SectionHeader,
  ListItem,
  IconContainer,
  Divider
} from '../components/StyledComponents';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from 'firebase/auth';

export default function PrivacyScreen() {
  const [privacySettings, setPrivacySettings] = useState({
    dataCollection: true,
    analytics: false,
    personalizedAds: false,
    locationSharing: false,
    dataRetention: '30', // 30일
    exportData: false,
  });
  const [loading, setLoading] = useState(true);
  const [showDataRetentionModal, setShowDataRetentionModal] = useState(false);
  const [tempDataRetention, setTempDataRetention] = useState('30');
  const navigation = useNavigation();

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const key = `privacySettings_${user.uid}`;
      const savedSettings = await AsyncStorage.getItem(key);
      
      if (savedSettings) {
        setPrivacySettings(JSON.parse(savedSettings));
        setTempDataRetention(JSON.parse(savedSettings).dataRetention);
      }
    } catch (error) {
      console.error('개인정보 설정 불러오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePrivacySettings = async (newSettings) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const key = `privacySettings_${user.uid}`;
      await AsyncStorage.setItem(key, JSON.stringify(newSettings));
      setPrivacySettings(newSettings);
    } catch (error) {
      console.error('개인정보 설정 저장 실패:', error);
      Alert.alert('오류', '설정 저장에 실패했습니다.');
    }
  };

  const handleSettingChange = async (key, value) => {
    const newSettings = { ...privacySettings, [key]: value };
    await savePrivacySettings(newSettings);
  };

  const handleDataRetentionChange = async (days) => {
    const newSettings = { ...privacySettings, dataRetention: days };
    await savePrivacySettings(newSettings);
    setTempDataRetention(days);
    setShowDataRetentionModal(false);
  };

  const handleExportData = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      // 사용자 데이터 수집
      const userData = {
        profile: {
          name: user.displayName,
          email: user.email,
          uid: user.uid,
        },
        settings: privacySettings,
        timestamp: new Date().toISOString(),
      };

      // 데이터를 JSON 형태로 내보내기 (실제로는 파일로 저장하거나 이메일로 전송)
      console.log('내보낼 데이터:', JSON.stringify(userData, null, 2));
      
      Alert.alert(
        '데이터 내보내기',
        '데이터가 성공적으로 준비되었습니다. 개발자 콘솔에서 확인할 수 있습니다.',
        [{ text: '확인' }]
      );
    } catch (error) {
      console.error('데이터 내보내기 실패:', error);
      Alert.alert('오류', '데이터 내보내기에 실패했습니다.');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '계정 삭제',
      '정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 모든 데이터가 영구적으로 삭제됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              '최종 확인',
              '계정 삭제를 진행하시겠습니까?',
              [
                { text: '취소', style: 'cancel' },
                {
                  text: '삭제',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      const auth = getAuth();
                      const user = auth.currentUser;
                      if (user) {
                        // Firebase에서 계정 삭제
                        await user.delete();
                        Alert.alert('완료', '계정이 삭제되었습니다.');
                        // 로그인 화면으로 이동
                        navigation.navigate('Main', { screen: 'Login' });
                      }
                    } catch (error) {
                      console.error('계정 삭제 실패:', error);
                      Alert.alert('오류', '계정 삭제에 실패했습니다.');
                    }
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const getDataRetentionText = (days) => {
    switch (days) {
      case '7': return '7일';
      case '30': return '30일';
      case '90': return '90일';
      case '365': return '1년';
      case '0': return '즉시 삭제';
      default: return `${days}일`;
    }
  };

  if (loading) {
    return (
      <Container>
        <View style={styles.loadingContainer}>
          <Ionicons name="shield-checkmark" size={48} color={Colors.primary} />
          <Text style={styles.loadingText}>개인정보 설정을 불러오는 중...</Text>
        </View>
      </Container>
    );
  }

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
        <Text style={styles.headerTitle}>개인정보 보호</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 데이터 수집 */}
        <SectionHeader>데이터 수집</SectionHeader>
        
        <Card style={styles.menuCard}>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <IconContainer>
                <Ionicons name="analytics" size={20} color={Colors.primary} />
              </IconContainer>
              <View style={styles.settingText}>
                <Text style={styles.label}>데이터 수집</Text>
                <Text style={styles.description}>
                  앱 사용 데이터를 수집하여 서비스 개선에 활용합니다
                </Text>
              </View>
            </View>
            <Switch
              value={privacySettings.dataCollection}
              onValueChange={(value) => handleSettingChange('dataCollection', value)}
              trackColor={{ false: Colors.border, true: Colors.primary + '40' }}
              thumbColor={privacySettings.dataCollection ? Colors.primary : Colors.textSecondary}
            />
          </View>
          
          <Divider />
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <IconContainer>
                <Ionicons name="bar-chart" size={20} color={Colors.info} />
              </IconContainer>
              <View style={styles.settingText}>
                <Text style={styles.label}>분석 데이터</Text>
                <Text style={styles.description}>
                  사용 패턴 분석을 위한 익명 데이터를 수집합니다
                </Text>
              </View>
            </View>
            <Switch
              value={privacySettings.analytics}
              onValueChange={(value) => handleSettingChange('analytics', value)}
              trackColor={{ false: Colors.border, true: Colors.primary + '40' }}
              thumbColor={privacySettings.analytics ? Colors.primary : Colors.textSecondary}
            />
          </View>
          
          <Divider />
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <IconContainer>
                <Ionicons name="location" size={20} color={Colors.warning} />
              </IconContainer>
              <View style={styles.settingText}>
                <Text style={styles.label}>위치 정보 공유</Text>
                <Text style={styles.description}>
                  위치 기반 서비스 제공을 위해 위치 정보를 사용합니다
                </Text>
              </View>
            </View>
            <Switch
              value={privacySettings.locationSharing}
              onValueChange={(value) => handleSettingChange('locationSharing', value)}
              trackColor={{ false: Colors.border, true: Colors.primary + '40' }}
              thumbColor={privacySettings.locationSharing ? Colors.primary : Colors.textSecondary}
            />
          </View>
        </Card>

        {/* 데이터 관리 */}
        <SectionHeader>데이터 관리</SectionHeader>
        
        <Card style={styles.menuCard}>
          <ListItem
            onPress={() => setShowDataRetentionModal(true)}
            icon="time"
            title="데이터 보관 기간"
            subtitle={`${getDataRetentionText(privacySettings.dataRetention)}`}
            rightIcon="chevron-forward"
          />
          <Divider />
          <ListItem
            onPress={handleExportData}
            icon="download"
            title="데이터 내보내기"
            subtitle="내 개인정보 데이터를 다운로드합니다"
            rightIcon="chevron-forward"
          />
        </Card>

        {/* 계정 관리 */}
        <SectionHeader>계정 관리</SectionHeader>
        
        <Card style={styles.menuCard}>
          <ListItem
            onPress={handleDeleteAccount}
            icon="trash"
            title="계정 삭제"
            subtitle="계정과 모든 데이터를 영구적으로 삭제합니다"
            rightIcon="chevron-forward"
          />
        </Card>

        {/* 개인정보 처리방침 */}
        <SectionHeader>정책</SectionHeader>
        
        <Card style={styles.menuCard}>
          <ListItem
            onPress={() => navigation.navigate('Settings', { screen: 'PrivacyPolicy' })}
            icon="document-text"
            title="개인정보 처리방침"
            subtitle="개인정보 수집 및 이용에 대한 안내"
            rightIcon="chevron-forward"
          />
          <Divider />
          <ListItem
            onPress={() => navigation.navigate('Settings', { screen: 'TermsOfService' })}
            icon="document"
            title="이용약관"
            subtitle="서비스 이용에 대한 약관"
            rightIcon="chevron-forward"
          />
        </Card>

        {/* 정보 */}
        <Card style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={20} color={Colors.info} />
            <Text style={styles.infoTitle}>개인정보 보호 안내</Text>
          </View>
          <Text style={styles.infoText}>
            • 수집된 데이터는 서비스 개선 목적으로만 사용됩니다{'\n'}
            • 개인정보는 암호화되어 안전하게 보관됩니다{'\n'}
            • 언제든지 데이터 수집을 중단할 수 있습니다{'\n'}
            • 데이터 삭제 요청 시 즉시 처리됩니다
          </Text>
        </Card>
      </ScrollView>

      {/* 데이터 보관 기간 선택 모달 */}
      <Modal
        visible={showDataRetentionModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>데이터 보관 기간 설정</Text>
            
            <View style={styles.retentionOptions}>
              {[
                { days: '7', label: '7일' },
                { days: '30', label: '30일' },
                { days: '90', label: '90일' },
                { days: '365', label: '1년' },
                { days: '0', label: '즉시 삭제' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.days}
                  style={[
                    styles.retentionOption,
                    tempDataRetention === option.days && styles.retentionOptionSelected
                  ]}
                  onPress={() => setTempDataRetention(option.days)}
                >
                  <Text style={[
                    styles.retentionOptionText,
                    tempDataRetention === option.days && styles.retentionOptionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setShowDataRetentionModal(false)}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={() => handleDataRetentionChange(tempDataRetention)}
              >
                <Text style={styles.confirmButtonText}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerSpacer: {
    width: 44,
  },

  // 로딩
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Theme.spacing.md,
    fontSize: Theme.typography.body.fontSize,
    color: Colors.textSecondary,
  },

  // 메뉴 카드
  menuCard: {
    marginHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },

  // 설정 아이템
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Theme.spacing.md,
  },
  settingText: {
    flex: 1,
  },
  label: {
    fontSize: Theme.typography.body.fontSize,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.xs,
  },
  description: {
    fontSize: Theme.typography.small.fontSize,
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  // 정보 카드
  infoCard: {
    marginHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    backgroundColor: Colors.info + '10',
    borderColor: Colors.info + '30',
    borderWidth: 1,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  infoTitle: {
    fontSize: Theme.typography.body.fontSize,
    fontWeight: '600',
    color: Colors.info,
    marginLeft: Theme.spacing.xs,
  },
  infoText: {
    fontSize: Theme.typography.small.fontSize,
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  // 모달
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    width: '80%',
    maxWidth: 400,
    ...Theme.shadows.large,
  },
  modalTitle: {
    fontSize: Theme.typography.h3.fontSize,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Theme.spacing.lg,
    color: Colors.textPrimary,
  },
  retentionOptions: {
    marginVertical: Theme.spacing.lg,
  },
  retentionOption: {
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Theme.spacing.sm,
    backgroundColor: Colors.surface,
  },
  retentionOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  retentionOptionText: {
    fontSize: Theme.typography.body.fontSize,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  retentionOptionTextSelected: {
    color: Colors.white,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Theme.spacing.lg,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    marginHorizontal: Theme.spacing.xs,
  },
  cancelButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontSize: Theme.typography.body.fontSize,
    fontWeight: '500',
  },
  confirmButtonText: {
    color: Colors.white,
    fontSize: Theme.typography.body.fontSize,
    fontWeight: '500',
  },
});
