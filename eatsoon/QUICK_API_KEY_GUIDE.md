# 🚀 Google Cloud API 키 생성 가이드

## 📋 단계별 설정

### **1단계: Google Cloud Console 접속**
1. 브라우저에서 [Google Cloud Console](https://console.cloud.google.com/) 접속
2. Google 계정으로 로그인
3. 프로젝트 `eatsoon` 선택

### **2단계: Speech-to-Text API 활성화**
1. 왼쪽 메뉴에서 **"API 및 서비스"** → **"라이브러리"** 클릭
2. 검색창에 **"Speech-to-Text"** 입력
3. **"Cloud Speech-to-Text API"** 클릭
4. **"사용"** 버튼 클릭

### **3단계: API 키 생성**
1. **"API 및 서비스"** → **"사용자 인증 정보"** 클릭
2. **"사용자 인증 정보 만들기"** 클릭
3. **"API 키"** 선택
4. 생성된 API 키 복사 (예: `AIzaSyB...`)

### **4단계: 앱에 API 키 설정**
`src/config/apiKeys.js` 파일에서:
```javascript
export const API_KEYS = {
  GOOGLE_SPEECH_API_KEY: 'AIzaSyB...', // 여기에 실제 API 키 입력
};
```

### **5단계: API 키 보안 설정 (권장)**
1. 생성된 API 키 클릭
2. **"애플리케이션 제한사항"** 설정:
   - Android: 패키지 이름 `com.eatsoon`
   - iOS: 번들 ID `com.eatsoon`
3. **"API 제한사항"** 설정:
   - **"Cloud Speech-to-Text API"**만 선택

## ✅ 완료 확인
앱 실행 후 콘솔에서 다음 메시지 확인:
```
API 키 상태: { GOOGLE_SPEECH_API_KEY: '설정됨' }
```

## 🔧 문제 해결
- **API 키 오류**: 키가 올바르게 설정되었는지 확인
- **권한 오류**: Speech-to-Text API가 활성화되었는지 확인
- **네트워크 오류**: 인터넷 연결 확인

## 💡 참고사항
- 월 60분 무료 할당량 제공
- 초과 시 분당 약 $0.006 (한국어)
- API 키는 절대 공개하지 마세요
