// screens/NotificationSettingsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { 
  saveNotificationSettings, 
  loadNotificationSettings,
  cancelAllNotifications
} from '../utils/notifications';
import { loadFoodItemsFromFirestore } from '../utils/firebaseStorage';
import { scheduleExpiryNotification, scheduleStockNotification } from '../utils/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
    expiryEnabled: false,
    stockEnabled: false,
    expiryDays: [3, 1, 0], // 3일 전, 1일 전, 당일
    stockThreshold: 2, // 재고 부족 임계값
    quietHours: { start: '22:00', end: '08:00' }, // 방해 금지 시간
  });
  const [loading, setLoading] = useState(true);
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);
  const [showThresholdPicker, setShowThresholdPicker] = useState(false);
  const [tempExpiryDays, setTempExpiryDays] = useState([3, 1, 0]);
  const [tempThreshold, setTempThreshold] = useState(2);
  const navigation = useNavigation();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await loadNotificationSettings();
      console.log('로드된 설정:', savedSettings);
      setSettings(savedSettings);
      setTempThreshold(savedSettings.stockThreshold);
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
    } catch (error) {
      console.error('설정 저장 실패:', error);
      Alert.alert('오류', '설정 저장에 실패했습니다.');
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

  const formatExpiryDays = (days) => {
    if ((days?.length || 0) === 0) return '설정되지 않음';
    return days.map(day => `${day}일 전`).join(', ');
  };

  const handleThresholdChange = async (threshold) => {
    const newSettings = { ...settings, stockThreshold: threshold };
    setSettings(newSettings);
    console.log('임계값 변경:', threshold, '새 설정:', newSettings);
    
    try {
      await saveNotificationSettings(newSettings);
      
      // 기존 알림 취소 후 새로운 설정으로 다시 예약
      await cancelAllNotifications();
      await reinitializeNotifications(newSettings);
      
      Alert.alert('알림 설정', `재고 부족 임계값이 ${threshold}개로 변경되었습니다.`);
    } catch (error) {
      console.error('임계값 설정 저장 실패:', error);
      Alert.alert('오류', '임계값 설정 저장에 실패했습니다.');
    }
  };

  // 알림 재초기화 함수
  const reinitializeNotifications = async (newSettings) => {
    try {
      const foodItems = await loadFoodItemsFromFirestore() || [];
      
      for (const item of foodItems) {
        // 유통기한 알림 예약
        await scheduleExpiryNotification(item);
        
        // 재고 부족 알림 예약 (새로운 임계값 사용)
        if (item.quantity <= newSettings.stockThreshold) {
          await scheduleStockNotification(item);
        }
      }
      
      console.log('알림이 새로운 설정으로 재초기화되었습니다.');
    } catch (error) {
      console.error('알림 재초기화 실패:', error);
    }
  };

  // 모든 알림 완전 초기화 함수 (긴급 수정용)
  const emergencyResetNotifications = async () => {
    try {
      // 모든 기존 알림 완전 취소
      await cancelAllNotifications();
      
      // AsyncStorage에서 중복 방지 키들도 모두 삭제
      const foodItems = await loadFoodItemsFromFirestore() || [];
      for (const item of foodItems) {
        await AsyncStorage.removeItem(`expiry_${item.id}`);
        await AsyncStorage.removeItem(`stock_${item.id}_${item.quantity}`);
      }
      
      console.log('모든 알림과 중복 방지 키가 완전히 삭제되었습니다.');
      
      // 새로운 로직으로 알림 재설정
      for (const item of foodItems) {
        console.log(`=== ${item.name} 알림 재설정 ===`);
        console.log(`유통기한 원본: ${item.expirationDate}`);
        
        // 날짜 파싱
        const [year, month, day] = item.expirationDate.split('-').map(Number);
        const expiryDate = new Date(year, month - 1, day);
        const today = new Date();
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const expiryOnly = new Date(expiryDate.getFullYear(), expiryDate.getMonth(), expiryDate.getDate());
        
        const diffTime = expiryOnly - todayOnly;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        console.log(`오늘: ${todayOnly.toDateString()}`);
        console.log(`유통기한: ${expiryOnly.toDateString()}`);
        console.log(`남은 일수: ${diffDays}일`);
        
        // 유통기한이 지났거나 오늘이면 알림 예약하지 않음
        if (diffDays <= 0) {
          console.log(`${item.name}: 유통기한이 지났거나 오늘이므로 알림 예약하지 않음`);
          continue;
        }
        
        // 설정된 알림 시점 중에서 가장 가까운 것만 예약
        const settings = await loadNotificationSettings();
        let closestNotification = null;
        let closestDays = Infinity;
        
        for (const days of settings.expiryDays) {
          // 더 안전한 날짜 계산: 밀리초 단위로 계산 후 날짜로 변환
          const triggerTime = expiryOnly.getTime() - (days * 24 * 60 * 60 * 1000);
          const triggerDate = new Date(triggerTime);
          const triggerDateOnly = new Date(triggerDate.getFullYear(), triggerDate.getMonth(), triggerDate.getDate());
          
          console.log(`${days}일 전 알림 시점: ${triggerDateOnly.toDateString()}`);
          
          // 과거 시간이면 스킵
          if (triggerDateOnly <= todayOnly) {
            console.log(`과거 시간이므로 스킵: ${days}일 전`);
            continue;
          }
          
          const daysUntilTrigger = Math.ceil((triggerDateOnly - todayOnly) / (1000 * 60 * 60 * 24));
          console.log(`알림까지 남은 일수: ${daysUntilTrigger}일`);
          
          if (daysUntilTrigger < closestDays) {
            closestDays = daysUntilTrigger;
            closestNotification = {
              days,
              triggerDate: triggerDateOnly,
              title: days === 0 ? '유통기한 만료 알림' : '유통기한 임박 알림',
              body: days === 0 
                ? `${item.name}의 유통기한이 오늘입니다.`
                : `${item.name}의 유통기한이 ${days}일 남았습니다.`
            };
            console.log(`가장 가까운 알림으로 설정: ${days}일 전`);
          }
        }
        
        if (closestNotification) {
          console.log(`${item.name}: ${closestNotification.days}일 전 알림 예약 (${closestNotification.triggerDate.toDateString()})`);
          await scheduleExpiryNotification(item);
        } else {
          console.log(`${item.name}: 예약할 알림 없음`);
        }
        
        // 재고 부족 알림
        if (item.quantity <= settings.stockThreshold) {
          await scheduleStockNotification(item);
        }
      }
      
      Alert.alert('긴급 수정 완료', '모든 알림이 올바르게 재설정되었습니다.');
    } catch (error) {
      console.error('긴급 수정 실패:', error);
      Alert.alert('오류', '긴급 수정에 실패했습니다.');
    }
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
            onPress={() => setShowThresholdPicker(true)}
            icon="cube"
            title="재고 부족 임계값"
            subtitle={`${settings.stockThreshold}개 이하일 때 알림`}
            rightIcon="chevron-forward"
          />
        </Card>

        {/* 고급 설정 */}
        <SectionHeader>고급 설정</SectionHeader>
        
        <Card style={styles.menuCard}>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <IconContainer>
                <Ionicons name="volume-high" size={20} color={Colors.textSecondary} />
              </IconContainer>
              <View style={styles.settingText}>
                <Text style={styles.label}>알림 소리</Text>
                <Text style={styles.description}>
                  알림이 올 때 소리를 재생합니다
                </Text>
              </View>
            </View>
            <Switch
              value={settings.soundEnabled}
              onValueChange={(value) => handleSettingChange('soundEnabled', value)}
              trackColor={{ false: Colors.border, true: Colors.primary + '40' }}
              thumbColor={settings.soundEnabled ? Colors.primary : Colors.textSecondary}
            />
          </View>
          
          <Divider />
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <IconContainer>
                <Ionicons name="phone-portrait" size={20} color={Colors.textSecondary} />
              </IconContainer>
              <View style={styles.settingText}>
                <Text style={styles.label}>진동</Text>
                <Text style={styles.description}>
                  알림이 올 때 진동을 울립니다
                </Text>
              </View>
            </View>
            <Switch
              value={settings.vibrationEnabled}
              onValueChange={(value) => handleSettingChange('vibrationEnabled', value)}
              trackColor={{ false: Colors.border, true: Colors.primary + '40' }}
              thumbColor={settings.vibrationEnabled ? Colors.primary : Colors.textSecondary}
            />
          </View>
          
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

        {/* 디버깅용 알림 재설정 버튼 */}
        <Card style={styles.menuCard}>
          <Button 
            style={styles.debugButton}
            onPress={emergencyResetNotifications}
          >
            <Ionicons name="refresh" size={20} color={Colors.white} />
            <ButtonText style={styles.debugButtonText}>긴급 알림 수정</ButtonText>
          </Button>
        </Card>
      </ScrollView>

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

      {/* 임계값 선택 모달 */}
      <Modal
        visible={showThresholdPicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>재고 부족 임계값 설정</Text>
            
            <View style={styles.thresholdOptions}>
              {[1, 2, 3].map((threshold) => (
                <TouchableOpacity
                  key={threshold}
                  style={[
                    styles.thresholdOption,
                    tempThreshold === threshold && styles.thresholdOptionSelected
                  ]}
                  onPress={() => setTempThreshold(threshold)}
                >
                  <Text style={[
                    styles.thresholdOptionText,
                    tempThreshold === threshold && styles.thresholdOptionTextSelected
                  ]}>
                    {threshold}개 이하
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.thresholdOptions}>
              {[4, 5, 10].map((threshold) => (
                <TouchableOpacity
                  key={threshold}
                  style={[
                    styles.thresholdOption,
                    tempThreshold === threshold && styles.thresholdOptionSelected
                  ]}
                  onPress={() => setTempThreshold(threshold)}
                >
                  <Text style={[
                    styles.thresholdOptionText,
                    tempThreshold === threshold && styles.thresholdOptionTextSelected
                  ]}>
                    {threshold}개 이하
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setShowThresholdPicker(false)}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={() => {
                  handleThresholdChange(tempThreshold);
                  setShowThresholdPicker(false);
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
  debugButton: {
    backgroundColor: Colors.warning,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.md,
  },
  debugButtonText: {
    marginLeft: Theme.spacing.sm,
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
  thresholdOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: Theme.spacing.md,
    paddingHorizontal: 8,
  },
  thresholdOption: {
    width: '30%',
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    minHeight: 50,
    justifyContent: 'center',
  },
  thresholdOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  thresholdOptionText: {
    fontSize: 13,
    color: Colors.textPrimary,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 16,
  },
  thresholdOptionTextSelected: {
    color: Colors.white,
    fontWeight: '500',
  },
  priorityOptions: {
    marginVertical: Theme.spacing.lg,
  },
  priorityOption: {
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Theme.spacing.sm,
    backgroundColor: Colors.surface,
  },
  priorityOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  priorityOptionContent: {
    alignItems: 'center',
  },
  priorityOptionText: {
    fontSize: Theme.typography.body.fontSize,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  priorityOptionTextSelected: {
    color: Colors.white,
  },
  priorityOptionDescription: {
    fontSize: Theme.typography.small.fontSize,
    color: Colors.textSecondary,
    marginTop: Theme.spacing.xs,
  },
  priorityOptionDescriptionSelected: {
    color: Colors.white + 'CC',
  },
});
