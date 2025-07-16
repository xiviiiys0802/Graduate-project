좋아, 이제 본격적으로 개발 들어가기 전에
**깔끔하고 협업하기 좋은 `src` 폴더 구조**부터 먼저 잡아줄게요!
Expo 기반 리액트 네이티브 프로젝트에 딱 맞는 구조로 설계해줄게요.

---

## ✅ 기본 `src` 폴더 구조 (협업용, 확장성 고려)

```
eatsoon/
├── src/
│   ├── assets/          # 이미지, 폰트, 로딩 GIF 등
│   ├── components/      # 공통 UI 컴포넌트 (Button, Header 등)
│   ├── screens/         # 페이지 단위 컴포넌트 (홈, 로그인 등)
│   ├── navigation/      # React Navigation 설정 (Stack, Tab 등)
│   ├── constants/       # 색상, 폰트, 크기 등 상수
│   ├── hooks/           # 커스텀 훅 모음
│   ├── api/             # API 호출 함수 모음 (axios 기반)
│   ├── contexts/        # 글로벌 상태관리용 Context들
│   ├── utils/           # 날짜, 문자열 처리 등 유틸 함수들
│   └── config/          # 환경설정, .env 로딩 등 설정 파일
├── App.js               # 진입점 → navigation로 연결
├── app.json             # Expo 앱 설정
└── eas.json             # EAS 빌드 설정
```

---

## 📁 각 폴더 상세 설명

| 폴더            | 역할                                                    |
| ------------- | ----------------------------------------------------- |
| `assets/`     | 앱에 들어가는 이미지, 폰트, 사운드 등 정적 리소스                         |
| `components/` | 버튼, 카드, 입력창 등 재사용 가능한 UI 컴포넌트                         |
| `screens/`    | 홈, 로그인, 마이페이지 등 전체 페이지 컴포넌트                           |
| `navigation/` | `React Navigation` 설정: Stack, Tab 구조 정의               |
| `constants/`  | 색상 코드, 폰트 사이즈, 스타일 상수 등                               |
| `hooks/`      | `useAuth`, `useFetch` 같은 커스텀 훅                        |
| `api/`        | `api/user.js`, `api/order.js` 등 API 연동 함수             |
| `contexts/`   | 전역 상태 공유용 Context API (`AuthContext`, `ThemeContext`) |
| `utils/`      | 날짜 포맷터, 전화번호 마스킹 등 공통 유틸 함수                           |
| `config/`     | 환경변수, axios 설정 등 앱 환경 설정                              |

---

## 🚀 App.js 예시 (navigation 연결)

```js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}
```

---

## 🧭 navigation 구조 예시 (`/src/navigation/RootNavigator.js`)

```js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
    </Stack.Navigator>
  );
}
```

---

## 📦 초기 세팅 도와줄 수 있음

원하면 아래까지도 바로 템플릿으로 만들어줄 수 있어:

* `constants/colors.js`, `fonts.js`
* `components/MyButton.js`
* `api/axiosInstance.js`
* `hooks/useAuth.js`

---

## 💬 다음 단계 추천

1. `src/` 폴더 만들고 위 구조로 하위 폴더 구성
2. `navigation/`부터 연결 → `HomeScreen`, `LoginScreen` 만들어 보기
3. `components/`에 Button 하나 만들어서 테스트

---

원하면 지금 바로 초기 템플릿 코드들 자동으로 생성해줄게.
예: `HomeScreen`, `RootNavigator`, `colors.js`, `MyButton.js` 이런 거!
필요한 초기 페이지 이름(예: 로그인/회원가입/홈 등) 알려줘봐.
