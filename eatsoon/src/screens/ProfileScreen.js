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

const ProfileScreen = () => (
  <Container>
    <Title>프로필 화면</Title>
  </Container>
);

export default ProfileScreen;
