// src/screens/LoginScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import CheckBox from '@react-native-community/checkbox';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);

  const { login, register } = useAuth();

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) => password.length >= 6;

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('오류', '이메일과 비밀번호를 입력해주세요.');
    if (!validateEmail(email)) return Alert.alert('오류', '올바른 이메일 형식이 아닙니다.');

    setLoading(true);
    try {
      await login(email.trim(), password, autoLogin);
    } catch (error) {
      Alert.alert('로그인 실패', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) return Alert.alert('오류', '모든 항목을 입력해주세요.');
    if (!validateEmail(email)) return Alert.alert('오류', '올바른 이메일 형식이 아닙니다.');
    if (!validatePassword(password)) return Alert.alert('오류', '비밀번호는 6자 이상이어야 합니다.');
    if (password !== confirmPassword) return Alert.alert('오류', '비밀번호가 일치하지 않습니다.');

    setLoading(true);
    try {
      await register(email.trim(), password);
      Alert.alert('회원가입 완료', '이제 로그인해주세요.');
      setIsLogin(true);
    } catch (error) {
      Alert.alert('회원가입 실패', error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setAutoLogin(false);
  };

  const handleSubmit = () => {
    isLogin ? handleLogin() : handleRegister();
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>EatSoon</Text>
          <Text style={styles.subtitle}>음식물 재고 관리</Text>
          <Text style={styles.formTitle}>{isLogin ? '로그인' : '회원가입'}</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>이메일</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="이메일"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>비밀번호</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="비밀번호"
              secureTextEntry
              editable={!loading}
            />
          </View>

          {!isLogin && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>비밀번호 확인</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="비밀번호 확인"
                secureTextEntry
                editable={!loading}
              />
            </View>
          )}

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAutoLogin(!autoLogin)}
          >
            <View style={[styles.checkbox, autoLogin && styles.checkboxChecked]}>
                {autoLogin && <Text style={styles.checkmark}>✓</Text>}</View>            
            <Text style={styles.checkboxLabel}>자동 로그인</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>{isLogin ? '로그인' : '회원가입'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleMode}>
            <Text style={styles.toggleText}>
              {isLogin ? '계정이 없으신가요? ' : '이미 계정이 있으신가요? '}
              <Text style={styles.toggleLink}>{isLogin ? '회원가입' : '로그인'}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  formContainer: { backgroundColor: '#fff', borderRadius: 12, padding: 30 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#4f62c0', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30 },
  formTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 16, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, backgroundColor: '#f9f9f9' },
  // styles에 아래 추가
  checkboxRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    borderColor: '#4f62c0',
  },
  checkmark: {
    fontSize: 14,
    color: '#4f62c0',
    fontWeight: 'bold',
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },


  submitButton: { backgroundColor: '#4f62c0', borderRadius: 8, padding: 15, alignItems: 'center' },
  disabledButton: { backgroundColor: '#aaa' },
  submitButtonText: { color: '#fff', fontSize: 18 },
  toggleText: { textAlign: 'center', marginTop: 20, fontSize: 16, color: '#666' },
  toggleLink: { color: '#4f62c0', fontWeight: 'bold', textDecorationLine: 'underline' },
});

export default LoginScreen;
