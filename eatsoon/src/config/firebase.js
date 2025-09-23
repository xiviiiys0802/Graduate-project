import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from "firebase/storage";

// EatSoon 프로젝트 설정
const firebaseConfig = {
  apiKey: "AIzaSyB-ApuhEYLl6anQtbCReL-N2D6L7xeT1fQ",
  authDomain: "eatsoon-16f59.firebaseapp.com",
  projectId: "eatsoon-16f59",
  storageBucket: "eatsoon-16f59.firebasestorage.app",
  messagingSenderId: "486393424980",
  appId: "1:486393424980:web:c032a099834c70b78a51c1",
  measurementId: "G-W27HCVN19P"
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Auth 초기화 (웹 호환)
const auth = getAuth(app);

// Firestore
const db = getFirestore(app);

// Storage
const storage = getStorage(app);

// 모듈 export
export { auth, db, storage };
export default app;