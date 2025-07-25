import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { useNavigation, CommonActions } from '@react-navigation/native';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false); // 중복 클릭 방지용
  const navigation = useNavigation();

  const handleSignUp = async () => {
    if (isLoading) return; // 중복 클릭 방지
    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      Alert.alert('회원가입 성공!', '', [
        {
          text: 'OK',
          onPress: () => {
            // 스택 초기화하면서 MainTabs로 이동
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
              })
            );
          },
        },
      ]);
    } catch (error) {
      // 에러 코드별 처리
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('이미 사용 중인 이메일입니다.');
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert('이메일 형식이 올바르지 않습니다.');
      } else if (error.code === 'auth/weak-password') {
        Alert.alert('비밀번호는 최소 6자리여야 합니다.');
      } else {
        Alert.alert('회원가입 실패', error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="이메일"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ borderBottomWidth: 1, marginBottom: 12 }}
      />
      <TextInput
        placeholder="비밀번호"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderBottomWidth: 1, marginBottom: 12 }}
      />
      <Button title={isLoading ? "처리 중..." : "회원가입"} onPress={handleSignUp} disabled={isLoading} />
    </View>
  );
}
