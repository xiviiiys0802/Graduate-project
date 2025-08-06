import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function StatisticsReportScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>통계/리포트 기능 준비 중</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
