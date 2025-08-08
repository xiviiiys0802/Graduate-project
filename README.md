

### ✅ **지금까지 완료한 내용**

1. **프로젝트 구조 잡음**

   * `App.js`에서 Stack Navigator로 로그인, 회원가입, 메인탭 연결 완료
   * `MainTabs.js`에서 하단 탭 네비게이션 구성 완료 (`Home`, `Profile`, `Settings`)

2. **회원가입/로그인**

   * `SignUpScreen.js`: Firebase 인증 연결, 회원가입 시 `MainTabs`로 이동
   * `LoginScreen.js`: 로그인 후 `MainTabs`로 이동 가능
   * 로그인/회원가입 오류 핸들링 Alert 적용됨

3. **화면 구성**

   * `HomeScreen.js`, `ProfileScreen.js`, `SettingsScreen.js` 기본 틀 작성 완료
   * `MainTabs.js`에서 각각 탭으로 연결 확인됨

4. **Profile(마이페이지) 화면**

   * 디자인 참고 이미지 기반으로 마이페이지 레이아웃 구성 시작함
   * 구성 요소:

     * 사용자 카드 (이미지, 닉네임, 이메일, 설명)
     * 메뉴 리스트 (알림, 공유, 나의 레시피, 장보기, 공지사항, 의견, 로그아웃, 탈퇴 등)

---

### 🔜 **다음 작업 추천**

1. **Firebase 연동**

   * 현재 로그인한 사용자 정보 받아오기 (`displayName`, `photoURL` 등)

2. **설정 화면에서 각 항목별 페이지 연결**

   * 예: ‘알림’ 누르면 알림 설정 화면으로 이동 등 (아직은 눌러도 동작 없음)

3. **상태관리 적용 (선택)**

   * 사용자 정보 전역 상태로 관리하고 싶다면 Context API나 Redux 고려

4. **로그아웃 기능 구현**

