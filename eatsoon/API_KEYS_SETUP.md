# 🔐 API 키 설정 가이드

## 📁 필요한 파일들

### **1. src/config/apiKeys.js**
이 파일을 생성하고 아래 내용을 복사하세요:

```javascript
// src/config/apiKeys.js
// API 키들을 중앙에서 관리하는 설정 파일
// 실제 프로젝트에서는 .env 파일을 사용하는 것을 권장합니다

export const API_KEYS = {
  // Google Cloud Speech-to-Text API 키
  // 아래에 실제 API 키를 입력하세요 (예: 'AIzaSyB...')
  GOOGLE_SPEECH_API_KEY: 'YOUR_GOOGLE_CLOUD_API_KEY_HERE',
};

// API 키 유효성 검사
export const validateAPIKeys = () => {
  const missingKeys = [];
  
  if (!API_KEYS.GOOGLE_SPEECH_API_KEY || 
      API_KEYS.GOOGLE_SPEECH_API_KEY === 'YOUR_GOOGLE_CLOUD_API_KEY' ||
      API_KEYS.GOOGLE_SPEECH_API_KEY === 'SIMULATION_MODE') {
    missingKeys.push('GOOGLE_SPEECH_API_KEY');
  }
  
  if (missingKeys.length > 0) {
    console.warn('다음 API 키가 설정되지 않았습니다:', missingKeys.join(', '));
    console.warn('시뮬레이션 모드로 실행됩니다.');
    return false;
  }
  
  return true;
};

// 개발 환경에서만 API 키를 콘솔에 출력 (보안상 프로덕션에서는 제거)
export const logAPIKeyStatus = () => {
  if (__DEV__) {
    console.log('API 키 상태:', {
      GOOGLE_SPEECH_API_KEY: API_KEYS.GOOGLE_SPEECH_API_KEY ? '설정됨' : '설정되지 않음',
    });
  }
};
```

### **2. src/config/serviceAccountKey.json**
Firebase Admin SDK용 서비스 계정 키 파일입니다. 필요시 Firebase Console에서 다운로드하세요.

## 🔑 API 키 생성 방법

### **Google Cloud Speech API 키 생성**
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택 또는 생성
3. **API 및 서비스** → **라이브러리**
4. **Cloud Speech-to-Text API** 검색 후 활성화
5. **사용자 인증 정보** → **사용자 인증 정보 만들기** → **API 키**
6. 생성된 키를 `apiKeys.js`의 `GOOGLE_SPEECH_API_KEY`에 입력

## ⚠️ 보안 주의사항

- **절대 공개하지 마세요**: API 키는 절대 GitHub 등에 올리지 마세요
- **환경 변수 사용**: 프로덕션에서는 `.env` 파일 사용을 권장합니다
- **키 제한 설정**: Google Cloud Console에서 API 키 사용 제한을 설정하세요

## 🚀 테스트 방법

1. 위 파일들을 생성하고 API 키 설정
2. `npm start`로 앱 실행
3. 음성 인식 기능 테스트

## 📞 문제 발생시

API 키 설정에 문제가 있으면 팀원에게 문의하세요.
