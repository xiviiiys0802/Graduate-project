import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getStorage } from "firebase/storage";

// ✅ 수정된 storageBucket
const firebaseConfig = {
  apiKey: "AIzaSyAsrjfiD4dxy0IMonFm_hfKsU2XYk1UDvE",
  authDomain: "test-c266f.firebaseapp.com",
  projectId: "test-c266f",
  storageBucket: "test-c266f.firebasestorage.app",
  messagingSenderId: "408620908267",
  appId: "1:408620908267:web:86c27c1f2bc445e3a548ae"
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Auth 초기화 (React Native 전용 persistence 설정)
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Firestore
const db = getFirestore(app);

// ✅ Storage 추가
const storage = getStorage(app);

// 모듈 export
export { auth, db, storage };
export default app;