// src/utils/googleSpeechAPI.js
import { Alert } from 'react-native';
import { API_KEYS, validateAPIKeys, logAPIKeyStatus } from '../config/apiKeys';

class GoogleSpeechAPI {
  constructor() {
    // API 키 상태 로깅
    logAPIKeyStatus();
    
    // Google Cloud Speech-to-Text API 설정
    this.apiKey = API_KEYS.GOOGLE_SPEECH_API_KEY;
    this.baseURL = 'https://speech.googleapis.com/v1/speech:recognize';
  }

  // 오디오 파일을 base64로 인코딩 (React Native 호환)
  async audioToBase64(audioUri) {
    try {
      console.log('오디오 파일 인코딩 시작:', audioUri);
      
      const response = await fetch(audioUri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          console.log('오디오 인코딩 완료, 길이:', base64.length);
          resolve(base64);
        };
        reader.onerror = (error) => {
          console.error('오디오 인코딩 실패:', error);
          reject(error);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('오디오 인코딩 실패:', error);
      throw error;
    }
  }

  // Google Speech-to-Text API 호출 (실제 API 사용)
  async recognizeSpeech(audioUri) {
    try {
      console.log('=== 음성 인식 시작 ===');
      console.log('API 키:', this.apiKey ? '설정됨' : '설정되지 않음');
      console.log('오디오 URI:', audioUri);
      
      // API 키가 설정되지 않은 경우 시뮬레이션 모드로 실행
      if (!this.apiKey || this.apiKey === 'YOUR_GOOGLE_CLOUD_API_KEY' || this.apiKey === 'SIMULATION_MODE') {
        console.log('API 키가 설정되지 않아 시뮬레이션 모드로 실행됩니다.');
        return this.getSimulatedResult();
      }

      // 실제 음성인식 시도
      console.log('실제 Google Cloud Speech-to-Text API를 사용합니다.');
      
      // 오디오를 base64로 변환
      console.log('오디오 인코딩 시작...');
      const audioContent = await this.audioToBase64(audioUri);
      console.log('오디오 인코딩 완료, 길이:', audioContent.length);
      
      // API 요청 데이터
      const requestData = {
        config: {
          encoding: 'MP3',
          sampleRateHertz: 44100,
          languageCode: 'ko-KR',
          alternativeLanguageCodes: ['en-US'],
          model: 'latest_long',
          useEnhanced: true,
        },
        audio: {
          content: audioContent,
        },
      };

      console.log('API 요청 전송 중...');
      
      // API 호출 (API 키 사용)
      const response = await fetch(`${this.baseURL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('API 응답 상태:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API 오류 상세:', errorData);
        throw new Error(`API 호출 실패: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log('API 응답 결과:', JSON.stringify(result, null, 2));
      
      if (result.error) {
        throw new Error(`API 오류: ${result.error.message}`);
      }

      // 결과 추출
      const transcript = result.results?.[0]?.alternatives?.[0]?.transcript;
      
      if (!transcript) {
        console.log('음성 인식 결과가 없습니다. 전체 결과:', result);
        throw new Error('음성을 인식할 수 없습니다.');
      }

      console.log('음성 인식 성공:', transcript);
      return transcript;

    } catch (error) {
      console.error('=== 음성 인식 실패 ===');
      console.error('오류 메시지:', error.message);
      console.error('오류 스택:', error.stack);
      
      // 오류 시 시뮬레이션 모드로 fallback
      console.log('오류로 인해 시뮬레이션 모드로 실행됩니다.');
      return this.getSimulatedResult();
    }
  }

  // 시뮬레이션 결과 (API 키가 없을 때 사용)
  getSimulatedResult() {
    const mockResults = [
      "사과 3개",
      "우유 2개",
      "빵 1개",
      "계란 12개",
      "치킨 1마리",
      "쌀 5kg",
      "김치 1kg",
      "양파 2개",
      "당근 3개",
      "감자 5개",
      "바나나 6개",
      "오렌지 4개",
      "포도 1kg",
      "치즈 2개",
      "요거트 4개",
      "밀가루 1kg",
      "돼지고기 500g",
      "소고기 300g",
      "생선 1마리",
      "새우 500g",
      "토마토 4개",
      "상추 1개",
      "고추 2개",
      "마늘 1kg",
      "생강 100g"
    ];
    
    const randomResult = mockResults[Math.floor(Math.random() * mockResults.length)];
    console.log('시뮬레이션 결과:', randomResult);
    return randomResult;
  }

  // 음성 인식 결과 파싱 (한국어 특화)
  parseKoreanSpeech(text) {
    // 한국어 음성 인식 결과를 파싱하는 정규식 패턴들
    const patterns = [
      // "사과 3개", "우유 2개" 패턴
      /^(.+?)\s*(\d+)\s*(개|마리|kg|g|ml|l|병|팩|통|봉)$/i,
      
      // "사과 세 개", "우유 두 개" 패턴 (한국어 숫자)
      /^(.+?)\s*(하나|둘|셋|넷|다섯|여섯|일곱|여덟|아홉|열|한|두|세|네|다섯|여섯|일곱|여덟|아홉|열)\s*(개|마리|kg|g|ml|l|병|팩|통|봉)$/i,
      
      // "사과 3", "우유 2" 패턴 (단위 없음)
      /^(.+?)\s*(\d+)$/i,
      
      // "사과", "우유" 패턴 (수량 없음)
      /^(.+?)$/i
    ];

    const koreanNumbers = {
      '하나': 1, '둘': 2, '셋': 3, '넷': 4, '다섯': 5,
      '여섯': 6, '일곱': 7, '여덟': 8, '아홉': 9, '열': 10,
      '한': 1, '두': 2, '세': 3, '네': 4
    };

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const name = match[1].trim();
        let quantity = 1;
        
        if (match[2]) {
          // 한국어 숫자인 경우
          if (koreanNumbers[match[2]]) {
            quantity = koreanNumbers[match[2]];
          } else {
            // 아라비아 숫자인 경우
            quantity = parseInt(match[2]);
          }
        }
        
        return { name, quantity };
      }
    }

    return { name: text.trim(), quantity: 1 };
  }
}

export default new GoogleSpeechAPI();
