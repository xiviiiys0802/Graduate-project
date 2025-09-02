// src/components/StyledComponents.js
import styled from 'styled-components/native';
import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Theme } from '../utils/colors';

// Container 컴포넌트
export const Container = styled.View`
  flex: 1;
  background-color: ${Colors.background};
  padding: ${Theme.spacing.md}px;
`;

// Title 컴포넌트
export const Title = styled.Text`
  font-size: ${Theme.typography.h2.fontSize}px;
  font-weight: ${Theme.typography.h2.fontWeight};
  color: ${Colors.textPrimary};
  margin-bottom: ${Theme.spacing.md}px;
  text-align: center;
`;

// Subtitle 컴포넌트
export const Subtitle = styled.Text`
  font-size: ${Theme.typography.body.fontSize}px;
  color: ${Colors.textSecondary};
  margin-bottom: ${Theme.spacing.lg}px;
  text-align: center;
`;

// Card 컴포넌트
export const Card = styled.View`
  background-color: ${Colors.surface};
  border-radius: ${Theme.borderRadius.lg}px;
  padding: ${Theme.spacing.lg}px;
  margin-bottom: ${Theme.spacing.md}px;
  ${Theme.shadows.medium}
`;

// Button 컴포넌트
export const Button = styled.TouchableOpacity`
  background-color: ${props => props.variant === 'secondary' ? Colors.secondary : Colors.primary};
  border-radius: ${Theme.borderRadius.md}px;
  padding: ${Theme.spacing.md}px ${Theme.spacing.lg}px;
  align-items: center;
  justify-content: center;
  margin-vertical: ${Theme.spacing.sm}px;
  ${props => props.disabled && `
    background-color: ${Colors.textDisabled};
  `}
`;

// Button Text 컴포넌트
export const ButtonText = styled.Text`
  color: ${Colors.textInverse};
  font-size: ${Theme.typography.body.fontSize}px;
  font-weight: 600;
`;

// Input 컴포넌트
export const Input = styled.TextInput`
  border-width: 1px;
  border-color: ${Colors.border};
  border-radius: ${Theme.borderRadius.md}px;
  padding: ${Theme.spacing.md}px;
  background-color: ${Colors.surface};
  font-size: ${Theme.typography.body.fontSize}px;
  color: ${Colors.textPrimary};
  margin-bottom: ${Theme.spacing.md}px;
  
  ${props => props.focused && `
    border-color: ${Colors.primary};
  `}
  
  ${props => props.error && `
    border-color: ${Colors.danger};
  `}
`;

// Label 컴포넌트
export const Label = styled.Text`
  font-size: ${Theme.typography.body.fontSize}px;
  font-weight: 500;
  color: ${Colors.textPrimary};
  margin-bottom: ${Theme.spacing.sm}px;
`;

// Divider 컴포넌트
export const Divider = styled.View`
  height: 1px;
  background-color: ${Colors.border};
  margin-vertical: ${Theme.spacing.md}px;
`;

// Badge 컴포넌트
export const Badge = styled.View`
  background-color: ${props => {
    switch (props.type) {
      case 'success': return Colors.success;
      case 'warning': return Colors.warning;
      case 'danger': return Colors.danger;
      case 'info': return Colors.info;
      default: return Colors.secondary;
    }
  }};
  padding-horizontal: ${Theme.spacing.sm}px;
  padding-vertical: ${Theme.spacing.xs}px;
  border-radius: ${Theme.borderRadius.round}px;
  align-self: flex-start;
`;

// Badge Text 컴포넌트
export const BadgeText = styled.Text`
  color: ${Colors.textInverse};
  font-size: ${Theme.typography.small.fontSize}px;
  font-weight: 500;
`;

// Loading Container 컴포넌트
export const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: ${Colors.background};
`;

// Empty State Container 컴포넌트
export const EmptyContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: ${Theme.spacing.xl}px;
`;

// Empty State Text 컴포넌트
export const EmptyText = styled.Text`
  font-size: ${Theme.typography.body.fontSize}px;
  color: ${Colors.textSecondary};
  text-align: center;
  margin-top: ${Theme.spacing.md}px;
`;

// Section Header 컴포넌트
export const SectionHeader = styled.Text`
  font-size: ${Theme.typography.h3.fontSize}px;
  font-weight: ${Theme.typography.h3.fontWeight};
  color: ${Colors.textPrimary};
  margin-bottom: ${Theme.spacing.md}px;
  margin-top: ${Theme.spacing.lg}px;
`;

// List Item 컴포넌트 (개선된 버전)
export const ListItem = ({ 
  onPress, 
  icon, 
  title, 
  subtitle, 
  rightIcon, 
  disabled = false,
  ...props 
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: Colors.surface,
        padding: Theme.spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        opacity: disabled ? 0.5 : 1,
      }}
      {...props}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        {icon && (
          <IconContainer>
            <Ionicons name={icon} size={20} color={Colors.textPrimary} />
          </IconContainer>
        )}
        <View style={{ flex: 1 }}>
          <ListItemText>{title}</ListItemText>
          {subtitle && <ListItemSubtext>{subtitle}</ListItemSubtext>}
        </View>
      </View>
      {rightIcon && (
        <Ionicons name={rightIcon} size={20} color={Colors.textSecondary} />
      )}
    </TouchableOpacity>
  );
};

// List Item Text 컴포넌트
export const ListItemText = styled.Text`
  font-size: ${Theme.typography.body.fontSize}px;
  color: ${Colors.textPrimary};
  flex: 1;
`;

// List Item Subtext 컴포넌트
export const ListItemSubtext = styled.Text`
  font-size: ${Theme.typography.caption.fontSize}px;
  color: ${Colors.textSecondary};
  margin-top: ${Theme.spacing.xs}px;
`;

// Icon Container 컴포넌트
export const IconContainer = styled.View`
  width: 40px;
  height: 40px;
  border-radius: ${Theme.borderRadius.round}px;
  background-color: ${props => props.color || Colors.primary};
  justify-content: center;
  align-items: center;
  margin-right: ${Theme.spacing.md}px;
`;

// Status Indicator 컴포넌트
export const StatusIndicator = styled.View`
  width: 8px;
  height: 8px;
  border-radius: ${Theme.borderRadius.round}px;
  background-color: ${props => {
    switch (props.status) {
      case 'active': return Colors.success;
      case 'warning': return Colors.warning;
      case 'error': return Colors.danger;
      default: return Colors.secondary;
    }
  }};
`;