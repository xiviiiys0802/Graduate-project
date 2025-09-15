import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Container, Title } from '../components/StyledComponents';

const CompactViewScreen = () => {
  return (
    <Container>
      <Title>Compact View Screen</Title>
      <Text style={styles.text}>This is the compact view for your food items.</Text>
    </Container>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    color: '#333',
    marginTop: 10,
  },
});

export default CompactViewScreen;