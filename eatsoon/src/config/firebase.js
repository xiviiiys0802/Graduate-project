import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyDlMFhWNT6YcHHFpc9Ya07eHkareNn2LlE",
  authDomain: "eatsoon-app.firebaseapp.com",
  projectId: "eatsoon-app",
  storageBucket: "eatsoon-app.firebasestorage.app",
  messagingSenderId: "981812902599",
  appId: "1:981812902599:web:5c8466d6e8f036b8b29ce2",
  measurementId: "G-KNEW5WEGPF"
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Auth 초기화 (React Native 전용 persistence 설정)
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Firestore 초기화
const db = getFirestore(app);

export { auth, db };
export default app;
