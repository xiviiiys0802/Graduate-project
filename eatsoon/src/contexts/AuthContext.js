import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ 자동 로그인 여부 확인
  useEffect(() => {
    const checkAutoLogin = async () => {
      try {
        const autoLogin = await AsyncStorage.getItem('autoLogin');
        
        // auth 객체가 완전히 초기화되었는지 확인
        if (!auth || typeof auth.onAuthStateChanged !== 'function') {
          console.log('Firebase auth가 아직 초기화되지 않았습니다. 잠시 후 다시 시도합니다.');
          setTimeout(checkAutoLogin, 100);
          return;
        }
        
        const unsubscribe = auth.onAuthStateChanged((user) => {
          if (user && autoLogin === 'true') {
            console.log('자동 로그인 허용됨, 로그인 유지:', user.email);
            setUser(user);
          } else {
            console.log('자동 로그인 미허용 또는 로그아웃 상태');
            setUser(null);
          }
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Auth 초기화 에러:', error);
        setLoading(false);
      }
    };

    checkAutoLogin();
  }, []);

  const login = async (email, password, autoLogin = false) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // ✅ 자동 로그인 여부 저장
      await AsyncStorage.setItem('autoLogin', autoLogin ? 'true' : 'false');

      setUser(userCredential.user);
      return userCredential.user;
    } catch (error) {
      console.error('로그인 실패:', error);
      
      // 사용자 친화적인 오류 메시지로 변환
      let errorMessage = '로그인이 잘못되었습니다. 확인해주세요.';
      
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-email':
        case 'auth/user-disabled':
          errorMessage = '로그인이 잘못되었습니다. 확인해주세요.';
          break;
        case 'auth/too-many-requests':
          errorMessage = '너무 많은 시도로 인해 일시적으로 차단되었습니다. 잠시 후 다시 시도해주세요.';
          break;
        case 'auth/network-request-failed':
          errorMessage = '네트워크 연결을 확인해주세요.';
          break;
        default:
          errorMessage = '로그인이 잘못되었습니다. 확인해주세요.';
      }
      
      throw new Error(errorMessage);
    }
  };

  const register = async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('회원가입 실패:', error);
      
      // 사용자 친화적인 오류 메시지로 변환
      let errorMessage = '회원가입에 실패했습니다.';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = '이미 사용 중인 이메일입니다.';
          break;
        case 'auth/invalid-email':
          errorMessage = '올바른 이메일 형식이 아닙니다.';
          break;
        case 'auth/weak-password':
          errorMessage = '비밀번호가 너무 약합니다. 6자 이상 입력해주세요.';
          break;
        case 'auth/network-request-failed':
          errorMessage = '네트워크 연결을 확인해주세요.';
          break;
        default:
          errorMessage = '회원가입에 실패했습니다.';
      }
      
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('autoLogin'); // ✅ 로그아웃 시 자동 로그인 제거
      setUser(null);
    } catch (error) {
      console.error('로그아웃 실패:', error);
      throw error;
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
