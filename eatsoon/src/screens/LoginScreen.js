import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { useNavigation, CommonActions } from '@react-navigation/native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  const handleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert('로그인 성공', '', [
        {
          text: 'OK',
          onPress: () => {
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
      if (error.code === 'auth/user-not-found') {
        Alert.alert('존재하지 않는 사용자입니다.');
      } else if (error.code === 'auth/wrong-password') {
        Alert.alert('비밀번호가 틀렸습니다.');
      } else {
        Alert.alert('로그인 실패', error.message);
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
      <Button title={isLoading ? "처리 중..." : "로그인"} onPress={handleLogin} disabled={isLoading} />
      <View style={{ marginTop: 20 }}>
        <Button title="회원가입" onPress={() => navigation.navigate('SignUp')} />
      </View>
    </View>
  );
}
