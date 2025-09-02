// screens/NotificationSettingsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { 
  saveNotificationSettings, 
  loadNotificationSettings,
  scheduleDailyNotification,
  cancelAllNotifications
} from '../utils/notifications';
import DateTimePicker from 'react-native-ui-datepicker';
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

export default function NotificationSettingsScreen() {
  const [settings, setSettings] = useState({
    expiryEnabled: true,
    stockEnabled: true,
    dailyEnabled: false,
    expiryDays: [3, 1, 0], // 3일 전, 1일 전, 당일
    dailyTime: '09:00' // 오전 9시
  });
  const [loading, setLoading] = useState(true);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);
  const [tempTime, setTempTime] = useState('09:00');
  const [tempExpiryDays, setTempExpiryDays] = useState([3, 1, 0]);
  const navigation = useNavigation();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await loadNotificationSettings();
      setSettings(savedSettings);
      setTempTime(savedSettings.dailyTime);
      setTempExpiryDays(savedSettings.expiryDays);
    } catch (error) {
      console.error('설정 불러오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    try {
      await saveNotificationSettings(newSettings);
      
      // 정기 알림 설정 변경 시 즉시 적용
      if (key === 'dailyEnabled') {
        if (value) {
          await scheduleDailyNotification();
          Alert.alert('알림 설정', `매일 ${settings.dailyTime}에 정기 알림이 설정되었습니다.`);
        } else {
          await cancelAllNotifications();
          Alert.alert('알림 설정', '정기 알림이 해제되었습니다.');
        }
      }
    } catch (error) {
      console.error('설정 저장 실패:', error);
      Alert.alert('오류', '설정 저장에 실패했습니다.');
    }
  };

  const handleTimeChange = async (time) => {
    const newSettings = { ...settings, dailyTime: time };
    setSettings(newSettings);
    setTempTime(time);
    
    try {
      await saveNotificationSettings(newSettings);
      
      // 정기 알림이 활성화되어 있다면 새로운 시간으로 재설정
      if (settings.dailyEnabled) {
        await scheduleDailyNotification();
        Alert.alert('알림 설정', `정기 알림 시간이 ${time}로 변경되었습니다.`);
      }
    } catch (error) {
      console.error('시간 설정 저장 실패:', error);
      Alert.alert('오류', '시간 설정 저장에 실패했습니다.');
    }
  };

  const handleExpiryDaysChange = async (days) => {
    const newSettings = { ...settings, expiryDays: days };
    setSettings(newSettings);
    setTempExpiryDays(days);
    
    try {
      await saveNotificationSettings(newSettings);
      Alert.alert('알림 설정', '유통기한 알림 시점이 변경되었습니다.');
    } catch (error) {
      console.error('유통기한 설정 저장 실패:', error);
      Alert.alert('오류', '유통기한 설정 저장에 실패했습니다.');
    }
  };

  const handleTestNotification = async () => {
    try {
      // 테스트 알림 발송
      const { scheduleNotificationAsync } = require('expo-notifications');
      await scheduleNotificationAsync({
        content: {
          title: '테스트 알림',
          body: '알림이 정상적으로 작동합니다!',
        },
        trigger: { seconds: 1 },
      });
      Alert.alert('성공', '테스트 알림이 발송되었습니다.');
    } catch (error) {
      console.error('테스트 알림 실패:', error);
      Alert.alert('오류', '테스트 알림 발송에 실패했습니다.');
    }
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? '오후' : '오전';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${ampm} ${displayHour}:${minutes}`;
  };

  const formatExpiryDays = (days) => {
    if (days.length === 0) return '설정되지 않음';
    return days.map(day => `${day}일 전`).join(', ');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>설정을 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <Container>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={28} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>알림 설정</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 알림 종류 */}
        <SectionHeader>알림 종류</SectionHeader>
        
        <Card style={styles.menuCard}>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <IconContainer>
                <Ionicons name="time" size={20} color={Colors.warning} />
              </IconContainer>
              <View style={styles.settingText}>
                <Text style={styles.label}>유통기한 알림</Text>
                <Text style={styles.description}>
                  음식의 유통기한이 임박할 때 알림을 받습니다
                </Text>
              </View>
            </View>
            <Switch
              value={settings.expiryEnabled}
              onValueChange={(value) => handleSettingChange('expiryEnabled', value)}
              trackColor={{ false: Colors.border, true: Colors.primary + '40' }}
              thumbColor={settings.expiryEnabled ? Colors.primary : Colors.textSecondary}
            />
          </View>
          
          <Divider />
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <IconContainer>
                <Ionicons name="alert-circle" size={20} color={Colors.danger} />
              </IconContainer>
              <View style={styles.settingText}>
                <Text style={styles.label}>재고 부족 알림</Text>
                <Text style={styles.description}>
                  음식 재고가 부족할 때 알림을 받습니다
                </Text>
              </View>
            </View>
            <Switch
              value={settings.stockEnabled}
              onValueChange={(value) => handleSettingChange('stockEnabled', value)}
              trackColor={{ false: Colors.border, true: Colors.primary + '40' }}
              thumbColor={settings.stockEnabled ? Colors.primary : Colors.textSecondary}
            />
          </View>
          
          <Divider />
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <IconContainer>
                <Ionicons name="notifications" size={20} color={Colors.info} />
              </IconContainer>
              <View style={styles.settingText}>
                <Text style={styles.label}>정기 알림</Text>
                <Text style={styles.description}>
                  매일 {formatTime(settings.dailyTime)}에 음식 재고 확인 알림을 받습니다
                </Text>
              </View>
            </View>
            <Switch
              value={settings.dailyEnabled}
              onValueChange={(value) => handleSettingChange('dailyEnabled', value)}
              trackColor={{ false: Colors.border, true: Colors.primary + '40' }}
              thumbColor={settings.dailyEnabled ? Colors.primary : Colors.textSecondary}
            />
          </View>
        </Card>

        {/* 알림 설정 */}
        <SectionHeader>알림 설정</SectionHeader>
        
        <Card style={styles.menuCard}>
          <ListItem
            onPress={() => setShowExpiryPicker(true)}
            icon="calendar"
            title="유통기한 알림 시점"
            subtitle={formatExpiryDays(settings.expiryDays)}
            rightIcon="chevron-forward"
          />
          <Divider />
          <ListItem
            onPress={() => setShowTimePicker(true)}
            icon="time"
            title="정기 알림 시간"
            subtitle={`매일 ${formatTime(settings.dailyTime)}에 알림`}
            rightIcon="chevron-forward"
          />
        </Card>

        {/* 기타 */}
        <SectionHeader>기타</SectionHeader>
        
        <Card style={styles.menuCard}>
          <Button 
            style={styles.testButton}
            onPress={handleTestNotification}
          >
            <Ionicons name="send" size={20} color={Colors.white} />
            <ButtonText style={styles.testButtonText}>테스트 알림 발송</ButtonText>
          </Button>

          <Button 
            style={styles.historyButton}
            onPress={() => navigation.navigate('Main', { screen: 'Settings', params: { screen: 'NotificationHistory' } })}
          >
            <Ionicons name="time" size={20} color={Colors.white} />
            <ButtonText style={styles.historyButtonText}>알림 히스토리 보기</ButtonText>
          </Button>
        </Card>
      </ScrollView>

      {/* 시간 선택 모달 */}
      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>알림 시간 설정</Text>
            
            <DateTimePicker
              mode="time"
              date={new Date(`2000-01-01T${tempTime}:00`)}
              onChange={({ date }) => {
                const hours = date.getHours().toString().padStart(2, '0');
                const minutes = date.getMinutes().toString().padStart(2, '0');
                const timeString = `${hours}:${minutes}`;
                setTempTime(timeString);
              }}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setShowTimePicker(false)}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={() => {
                  handleTimeChange(tempTime);
                  setShowTimePicker(false);
                }}
              >
                <Text style={styles.confirmButtonText}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 유통기한 알림 시점 선택 모달 */}
      <Modal
        visible={showExpiryPicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>유통기한 알림 시점 설정</Text>
            
            <View style={styles.expiryOptions}>
              {[7, 5, 3, 2, 1, 0].map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.expiryOption,
                    tempExpiryDays.includes(day) && styles.expiryOptionSelected
                  ]}
                  onPress={() => {
                    if (tempExpiryDays.includes(day)) {
                      setTempExpiryDays(tempExpiryDays.filter(d => d !== day));
                    } else {
                      setTempExpiryDays([...tempExpiryDays, day].sort((a, b) => b - a));
                    }
                  }}
                >
                  <Text style={[
                    styles.expiryOptionText,
                    tempExpiryDays.includes(day) && styles.expiryOptionTextSelected
                  ]}>
                    {day === 0 ? '당일' : `${day}일 전`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setShowExpiryPicker(false)}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={() => {
                  handleExpiryDaysChange(tempExpiryDays);
                  setShowExpiryPicker(false);
                }}
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

  // 버튼
  testButton: {
    marginBottom: Theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  testButtonText: {
    marginLeft: Theme.spacing.xs,
  },
  historyButton: {
    backgroundColor: Colors.info,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyButtonText: {
    marginLeft: Theme.spacing.xs,
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
  expiryOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: Theme.spacing.lg,
  },
  expiryOption: {
    width: '30%',
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
    backgroundColor: Colors.surface,
  },
  expiryOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  expiryOptionText: {
    fontSize: Theme.typography.small.fontSize,
    color: Colors.textPrimary,
  },
  expiryOptionTextSelected: {
    color: Colors.white,
    fontWeight: '500',
  },
});
