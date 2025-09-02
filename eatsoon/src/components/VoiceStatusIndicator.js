// src/components/VoiceStatusIndicator.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Theme } from '../utils/colors';
import { validateAPIKeys } from '../config/apiKeys';

const VoiceStatusIndicator = ({ isRecording, status = 'idle' }) => {
  const [pulseAnim] = useState(new Animated.Value(1));
  const [apiKeyValid, setApiKeyValid] = useState(true);

  useEffect(() => {
    // API 키 유효성 검사
    setApiKeyValid(validateAPIKeys());
  }, []);

  useEffect(() => {
    if (isRecording) {
      // 펄스 애니메이션 시작
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // 애니메이션 중지
      pulseAnim.stopAnimation();
    }
  }, [isRecording, pulseAnim]);

  const getStatusInfo = () => {
    switch (status) {
      case 'recording':
        return {
          icon: 'mic',
          color: Colors.danger,
          text: '음성 인식 중...',
          subtext: '음식을 말씀해주세요'
        };
      case 'processing':
        return {
          icon: 'sync',
          color: Colors.warning,
          text: '음성 처리 중...',
          subtext: '잠시만 기다려주세요'
        };
      case 'success':
        return {
          icon: 'checkmark-circle',
          color: Colors.success,
          text: '인식 완료!',
          subtext: '결과를 확인해주세요'
        };
      case 'error':
        return {
          icon: 'alert-circle',
          color: Colors.danger,
          text: '인식 실패',
          subtext: '다시 시도해주세요'
        };
      default:
        return {
          icon: 'mic-outline',
          color: Colors.textSecondary,
          text: '음성 인식 준비',
          subtext: apiKeyValid ? '마이크 버튼을 눌러주세요' : '시뮬레이션 모드'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.iconContainer,
          { transform: [{ scale: pulseAnim }] }
        ]}
      >
        <Ionicons
          name={statusInfo.icon}
          size={24}
          color={statusInfo.color}
        />
      </Animated.View>
      
      <View style={styles.textContainer}>
        <Text style={[styles.statusText, { color: statusInfo.color }]}>
          {statusInfo.text}
        </Text>
        <Text style={styles.subtext}>
          {statusInfo.subtext}
        </Text>
      </View>
      
      {!apiKeyValid && (
        <View style={styles.warningContainer}>
          <Ionicons name="warning" size={16} color={Colors.warning} />
          <Text style={styles.warningText}>시뮬레이션 모드</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: Theme.spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
    ...Theme.shadows.small,
  },
  textContainer: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: Theme.typography.body.fontSize,
    fontWeight: '600',
    marginBottom: Theme.spacing.xs,
  },
  subtext: {
    fontSize: Theme.typography.caption.fontSize,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    backgroundColor: Colors.warning + '20',
    borderRadius: Theme.borderRadius.md,
  },
  warningText: {
    fontSize: Theme.typography.small.fontSize,
    color: Colors.warning,
    marginLeft: Theme.spacing.xs,
  },
});

export default VoiceStatusIndicator;
