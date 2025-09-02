// src/components/VoiceResultDisplay.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Theme } from '../utils/colors';

const VoiceResultDisplay = ({ result, onClear, onConfirm }) => {
  if (!result) return null;

  return (
    <View style={styles.container}>
      <View style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
          <Text style={styles.resultTitle}>음성 인식 완료</Text>
        </View>
        
        <View style={styles.resultContent}>
          <Text style={styles.foodName}>{result.name}</Text>
          <Text style={styles.quantity}>수량: {result.quantity}개</Text>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
            <Ionicons name="checkmark" size={16} color={Colors.textInverse} />
            <Text style={styles.confirmButtonText}>확인</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.clearButton} onPress={onClear}>
            <Ionicons name="close" size={16} color={Colors.textSecondary} />
            <Text style={styles.clearButtonText}>다시</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Theme.spacing.md,
  },
  resultCard: {
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
    ...Theme.shadows.small,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  resultTitle: {
    fontSize: Theme.typography.body.fontSize,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginLeft: Theme.spacing.sm,
  },
  resultContent: {
    marginBottom: Theme.spacing.md,
  },
  foodName: {
    fontSize: Theme.typography.h3.fontSize,
    fontWeight: Theme.typography.h3.fontWeight,
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.xs,
  },
  quantity: {
    fontSize: Theme.typography.body.fontSize,
    color: Colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
  },
  confirmButtonText: {
    color: Colors.textInverse,
    fontSize: Theme.typography.body.fontSize,
    fontWeight: '600',
    marginLeft: Theme.spacing.xs,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.lightGray,
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
  },
  clearButtonText: {
    color: Colors.textSecondary,
    fontSize: Theme.typography.body.fontSize,
    marginLeft: Theme.spacing.xs,
  },
});

export default VoiceResultDisplay;
