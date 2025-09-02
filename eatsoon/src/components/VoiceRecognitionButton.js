// src/components/VoiceRecognitionButton.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Theme } from '../utils/colors';
import SpeechRecognition from '../utils/speechRecognition';

const VoiceRecognitionButton = ({ onResult, disabled = false }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    let interval;
    
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

      // 녹음 시간 카운터
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      // 애니메이션 중지
      pulseAnim.stopAnimation();
      setRecordingTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, pulseAnim]);

  const handlePress = async () => {
    if (disabled) return;

    if (isRecording) {
      // 녹음 중지
      setIsRecording(false);
      await SpeechRecognition.stopRecording();
    } else {
      // 녹음 시작
      const success = await SpeechRecognition.startRecording((transcript, parsed) => {
        setIsRecording(false);
        
        // 음성 피드백
        SpeechRecognition.speak(`인식된 음식: ${parsed.name} ${parsed.quantity}개`);
        
        // 결과 전달
        if (onResult) {
          onResult(parsed);
        }
      });

      if (success) {
        setIsRecording(true);
        SpeechRecognition.speak('음성 인식을 시작합니다. 음식을 말씀해주세요.');
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.button,
          isRecording && styles.recordingButton,
          disabled && styles.disabledButton,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.touchable}
          onPress={handlePress}
          disabled={disabled}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isRecording ? 'mic' : 'mic-outline'}
            size={24}
            color={isRecording ? Colors.danger : Colors.textInverse}
          />
        </TouchableOpacity>
      </Animated.View>

      {isRecording && (
        <View style={styles.recordingInfo}>
          <Text style={styles.recordingText}>음성 인식 중...</Text>
          <Text style={styles.recordingTime}>{formatTime(recordingTime)}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.medium,
  },
  recordingButton: {
    backgroundColor: Colors.danger,
  },
  disabledButton: {
    backgroundColor: Colors.textDisabled,
  },
  touchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingInfo: {
    marginTop: Theme.spacing.sm,
    alignItems: 'center',
  },
  recordingText: {
    fontSize: Theme.typography.caption.fontSize,
    color: Colors.textSecondary,
    marginBottom: Theme.spacing.xs,
  },
  recordingTime: {
    fontSize: Theme.typography.small.fontSize,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
});

export default VoiceRecognitionButton;
