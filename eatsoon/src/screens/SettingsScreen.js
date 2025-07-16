import React from 'react';
import styled from 'styled-components/native';

const Container = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const Title = styled.Text`
  font-size: 24px;
  font-weight: bold;
`;

const SettingsScreen = () => (
  <Container>
    <Title>설정 화면</Title>
  </Container>
);

export default SettingsScreen;
