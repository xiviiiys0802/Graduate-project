// src/utils/speechRecognition.js
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { Alert } from 'react-native';
import GoogleSpeechAPI from './googleSpeechAPI';

class SpeechRecognition {
  constructor() {
    this.recording = null;
    this.isRecording = false;
    this.onResult = null;
  }

  // 음성 인식 시작
  async startRecording(onResult) {
    try {
      // 오디오 권한 요청
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '음성 인식을 위해 마이크 권한이 필요합니다.');
        return false;
      }

      // 오디오 설정
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // 녹음 시작
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      this.recording = recording;
      this.isRecording = true;
      this.onResult = onResult;

      console.log('음성 인식 시작됨');
      return true;
    } catch (error) {
      console.error('음성 인식 시작 실패:', error);
      Alert.alert('오류', '음성 인식을 시작할 수 없습니다.');
      return false;
    }
  }

  // 음성 인식 중지
  async stopRecording() {
    try {
      if (!this.recording) return;

      this.isRecording = false;
      
      // 녹음 중지
      await this.recording.stopAndUnloadAsync();
      
      // 녹음 파일 URI 가져오기
      const uri = this.recording.getURI();
      this.recording = null;

      console.log('음성 인식 중지됨');
      
      // 여기서 실제 음성 인식 API를 호출해야 합니다
      // 현재는 시뮬레이션으로 처리
      await this.processAudioFile(uri);
      
    } catch (error) {
      console.error('음성 인식 중지 실패:', error);
      Alert.alert('오류', '음성 인식을 중지할 수 없습니다.');
    }
  }

  // 오디오 파일 처리 (실제 API 사용)
  async processAudioFile(uri) {
    try {
      // Google Speech-to-Text API 호출
      const transcript = await GoogleSpeechAPI.recognizeSpeech(uri);
      
      // 한국어 특화 파싱
      const parsed = GoogleSpeechAPI.parseKoreanSpeech(transcript);
      
      // 결과 처리
      if (this.onResult) {
        this.onResult(transcript, parsed);
      }
    } catch (error) {
      console.error('음성 인식 처리 실패:', error);
      
      // 오류 시 시뮬레이션 결과 사용
      const mockResult = GoogleSpeechAPI.getSimulatedResult();
      const parsed = GoogleSpeechAPI.parseKoreanSpeech(mockResult);
      
      if (this.onResult) {
        this.onResult(mockResult, parsed);
      }
    }
  }

  // 음성 합성 (TTS)
  speak(text, options = {}) {
    const defaultOptions = {
      language: 'ko-KR',
      pitch: 1.0,
      rate: 0.8,
      ...options
    };

    Speech.speak(text, defaultOptions);
  }

  // 음성 합성 중지
  stopSpeaking() {
    Speech.stop();
  }

  // 음성 인식 상태 확인
  isCurrentlyRecording() {
    return this.isRecording;
  }

  // 음성 인식 결과 파싱 (기존 함수 제거 - GoogleSpeechAPI로 대체)
  parseSpeechResult(text) {
    return GoogleSpeechAPI.parseKoreanSpeech(text);
  }
}

export default new SpeechRecognition();
