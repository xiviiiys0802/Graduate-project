// screens/NotificationSettingsScreen.js
import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';

export default function NotificationSettingsScreen() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>알림 설정</Text>

      <View style={styles.settingItem}>
        <Text style={styles.label}>푸시 알림</Text>
        <Switch
          value={pushEnabled}
          onValueChange={(val) => setPushEnabled(val)}
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.label}>이메일 알림</Text>
        <Switch
          value={emailEnabled}
          onValueChange={(val) => setEmailEnabled(val)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  label: {
    fontSize: 16,
  },
});
