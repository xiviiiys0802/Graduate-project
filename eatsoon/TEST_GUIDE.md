# 🚀 EatSoon 앱 테스트 가이드

## 📱 앱 실행 방법

### **1단계: 의존성 설치**
```bash
npm install
```

### **2단계: 앱 실행**
```bash
npm start
```

### **3단계: 디바이스에서 테스트**
- **iOS**: Expo Go 앱으로 QR 코드 스캔
- **Android**: Expo Go 앱으로 QR 코드 스캔
- **시뮬레이터**: 터미널에서 `i` (iOS) 또는 `a` (Android) 입력

## 🔧 API 키 설정 (필수)

### **음성 인식 기능 사용**
실제 Google Cloud Speech-to-Text API를 사용하므로 API 키가 필요합니다.

#### **apiKeys.js 파일이 없을 때:**
보안상 API 키 파일들이 `.gitignore`에 추가되어 원격 저장소에 올라가지 않았습니다.

**해결 방법:**
1. `API_KEYS_SETUP.md` 파일을 참고하여 필요한 파일들을 생성하세요
2. 또는 아래 내용으로 `src/config/apiKeys.js` 파일을 생성하세요:

```javascript
// src/config/apiKeys.js
export const API_KEYS = {
  GOOGLE_SPEECH_API_KEY: 'YOUR_GOOGLE_CLOUD_API_KEY', // 여기에 실제 API 키 입력
};

export const validateAPIKeys = () => {
  const missingKeys = [];
  
  if (!API_KEYS.GOOGLE_SPEECH_API_KEY || 
      API_KEYS.GOOGLE_SPEECH_API_KEY === 'YOUR_GOOGLE_CLOUD_API_KEY') {
    missingKeys.push('GOOGLE_SPEECH_API_KEY');
  }
  
  if (missingKeys.length > 0) {
    console.warn('다음 API 키가 설정되지 않았습니다:', missingKeys.join(', '));
    return false;
  }
  
  return true;
};

export const logAPIKeyStatus = () => {
  if (__DEV__) {
    console.log('API 키 상태:', {
      GOOGLE_SPEECH_API_KEY: API_KEYS.GOOGLE_SPEECH_API_KEY ? '설정됨' : '설정되지 않음',
    });
  }
};
```

#### **API 키 생성 방법:**
자세한 가이드는 `QUICK_API_KEY_GUIDE.md` 파일을 참고하세요.

## ✅ 테스트 가능한 기능들

### **기본 기능**
- ✅ 홈 화면: 음식 추가, 목록 보기
- ✅ 음성 인식: Google Cloud Speech API 사용
- ✅ 알림 설정: 유통기한, 재고 부족 알림
- ✅ 프로필 관리: 정보 수정, 사진 업로드

### **더보기 탭**
- ✅ 레시피 추천: 탭으로 전환 가능
- ✅ 장보기 리스트: 항목 추가/삭제/체크
- ✅ 필터 기능: 완전매칭, 부족≤1 등

### **마이페이지**
- ✅ 사용 통계: 차트로 표시
- ✅ 알림 히스토리: 필터링 기능
- ✅ 개인정보 보호: 설정 및 정책
- ✅ 도움말: 사용 가이드

## 🐛 문제 해결

### **apiKeys.js 파일이 없을 때**
위의 "apiKeys.js 파일이 없을 때" 섹션을 참고하세요.

### **앱이 실행되지 않을 때**
```bash
# 캐시 클리어
npx expo start --clear

# node_modules 재설치
rm -rf node_modules
npm install
```

### **음성 인식이 작동하지 않을 때**
- API 키가 올바르게 설정되었는지 확인
- Google Cloud Speech-to-Text API가 활성화되었는지 확인
- 네트워크 연결 확인

### **Firebase 오류**
- Firebase 프로젝트 설정 확인
- `src/config/firebase.js` 파일 확인

### **네트워크 오류**
- 인터넷 연결 확인
- 방화벽 설정 확인

## 📝 테스트 체크리스트

- [ ] 앱 실행 및 로그인
- [ ] 홈 화면에서 음식 추가
- [ ] 음성 인식 버튼 테스트
- [ ] 알림 설정 변경
- [ ] 더보기 탭에서 레시피 추천 확인
- [ ] 더보기 탭에서 장보기 리스트 테스트
- [ ] 마이페이지에서 통계 확인
- [ ] 알림 히스토리 필터링 테스트
- [ ] 프로필 사진 업로드 (선택사항)

## 💡 참고사항

- **API 키 필요**: 음성 인식 기능 사용시 Google Cloud API 키 필수
- **실제 데이터**: Firebase에 연결되어 실제 데이터 저장/조회
- **네트워크**: 음성 인식 기능은 인터넷 연결 필요

## 🆘 도움이 필요할 때

문제가 발생하면 다음 정보와 함께 이슈를 등록해주세요:
- 디바이스 정보 (iOS/Android, 버전)
- 오류 메시지
- 재현 단계
- 콘솔 로그 (가능한 경우)
