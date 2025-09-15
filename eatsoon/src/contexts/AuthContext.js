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
      throw error;
    }
  };

  const register = async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('회원가입 실패:', error);
      throw error;
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
