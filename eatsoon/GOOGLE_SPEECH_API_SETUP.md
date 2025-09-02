# Google Cloud Speech-to-Text API 설정 가이드

## 1. Google Cloud 프로젝트 생성

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. 프로젝트 이름: `eatsoon-speech-recognition` (예시)

## 2. Speech-to-Text API 활성화

1. Google Cloud Console에서 **API 및 서비스** → **라이브러리** 클릭
2. "Speech-to-Text" 검색
3. **Speech-to-Text API** 선택 후 **사용** 클릭

## 3. 서비스 계정 및 API 키 생성

### 서비스 계정 생성
1. **IAM 및 관리** → **서비스 계정** 클릭
2. **서비스 계정 만들기** 클릭
3. 서비스 계정 이름: `speech-recognition-service`
4. 설명: `EatSoon 음성인식 서비스`
5. **만들고 계속** 클릭

### API 키 생성
1. **키** 탭 클릭
2. **키 추가** → **새 키 만들기** → **JSON** 선택
3. JSON 파일이 다운로드됨 (이 파일을 안전하게 보관)

## 4. API 키 설정

### 방법 1: 직접 설정 (개발용)
`src/config/apiKeys.js` 파일에서:
```javascript
export const API_KEYS = {
  GOOGLE_SPEECH_API_KEY: 'your_actual_api_key_here',
};
```

### 방법 2: 환경변수 사용 (권장)
1. 프로젝트 루트에 `.env` 파일 생성:
```
GOOGLE_SPEECH_API_KEY=your_actual_api_key_here
```

2. `react-native-dotenv` 설치:
```bash
npm install react-native-dotenv
```

3. `babel.config.js`에 추가:
```javascript
module.exports = {
  plugins: [
    ["module:react-native-dotenv", {
      "moduleName": "@env",
      "path": ".env",
    }]
  ]
};
```

4. `src/config/apiKeys.js` 수정:
```javascript
import { GOOGLE_SPEECH_API_KEY } from '@env';

export const API_KEYS = {
  GOOGLE_SPEECH_API_KEY,
};
```

## 5. 보안 설정

### API 키 제한 설정
1. Google Cloud Console에서 **API 및 서비스** → **사용자 인증 정보** 클릭
2. 생성한 API 키 클릭
3. **애플리케이션 제한사항** 설정:
   - **Android 앱**: 패키지 이름과 SHA-1 인증서 지문 추가
   - **iOS 앱**: 번들 ID 추가
4. **API 제한사항** 설정:
   - **Speech-to-Text API**만 선택

## 6. 사용량 및 비용

### 무료 할당량
- 월 60분 무료 음성 인식
- 초과 시 분당 약 $0.006 (한국어)

### 사용량 모니터링
1. Google Cloud Console에서 **결제** 클릭
2. **예산 및 알림** 설정
3. 월 사용량 제한 설정 권장

## 7. 테스트

### API 키 유효성 검사
앱 실행 시 콘솔에서 다음 메시지 확인:
```
API 키 상태: { GOOGLE_SPEECH_API_KEY: '설정됨' }
```

### 음성 인식 테스트
1. 앱에서 음성인식 버튼 클릭
2. "사과 3개" 말하기
3. 정확한 인식 결과 확인

## 8. 문제 해결

### 일반적인 오류
- **API 키 오류**: 키가 올바르게 설정되었는지 확인
- **권한 오류**: Speech-to-Text API가 활성화되었는지 확인
- **네트워크 오류**: 인터넷 연결 확인

### 디버깅
- 개발자 도구에서 네트워크 요청 확인
- Google Cloud Console에서 API 사용량 확인

## 9. 프로덕션 배포 시 주의사항

1. **API 키 보안**: 환경변수 사용 필수
2. **사용량 제한**: 월 사용량 제한 설정
3. **모니터링**: 사용량 및 오류 모니터링 설정
4. **백업**: 시뮬레이션 모드 유지
