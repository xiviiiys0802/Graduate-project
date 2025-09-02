// src/utils/colors.js
export const Colors = {
  // Primary Colors
  primary: '#4f62c0',        // 메인 브랜드 컬러 (기존 사용 중)
  primaryLight: '#6c7bd9',    // 밝은 버전
  primaryDark: '#3a4a9a',     // 어두운 버전
  
  // Secondary Colors
  secondary: '#6c757d',       // 보조 색상
  secondaryLight: '#8a9299',
  secondaryDark: '#495057',
  
  // Success Colors
  success: '#28a745',         // 성공/완료
  successLight: '#4caf50',
  successDark: '#1e7e34',
  
  // Warning Colors
  warning: '#ffc107',         // 경고
  warningLight: '#ff9800',
  warningDark: '#e0a800',
  
  // Danger Colors
  danger: '#dc3545',          // 위험/오류
  dangerLight: '#f44336',
  dangerDark: '#c82333',
  
  // Info Colors
  info: '#17a2b8',           // 정보
  infoLight: '#2196f3',
  infoDark: '#117a8b',
  
  // Neutral Colors
  white: '#ffffff',
  lightGray: '#f8f9fa',       // 배경색
  gray: '#e9ecef',            // 경계선
  darkGray: '#6c757d',        // 텍스트
  black: '#000000',
  
  // Background Colors
  background: '#f8f9fa',
  surface: '#ffffff',
  surfaceVariant: '#f2f2f2',
  
  // Text Colors
  textPrimary: '#212529',
  textSecondary: '#6c757d',
  textDisabled: '#adb5bd',
  textInverse: '#ffffff',
  
  // Border Colors
  border: '#dee2e6',
  borderLight: '#e9ecef',
  borderDark: '#adb5bd',
  
  // Shadow Colors
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowDark: 'rgba(0, 0, 0, 0.2)',
  
  // Notification Colors
  notificationExpiry: '#f44336',    // 유통기한 알림
  notificationStock: '#ff9800',     // 재고 알림
  notificationDaily: '#4caf50',     // 정기 알림
  
  // Category Colors (음식 카테고리별)
  categoryVegetable: '#4caf50',     // 채소
  categoryFruit: '#ff9800',         // 과일
  categoryMeat: '#f44336',          // 육류
  categoryDairy: '#2196f3',         // 유제품
  categoryGrain: '#795548',         // 곡물
  categoryOther: '#9c27b0',        // 기타
};

// 색상 유틸리티 함수들
export const ColorUtils = {
  // 투명도 적용
  withOpacity: (color, opacity) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  },
  
  // 밝기 조정
  lighten: (color, amount) => {
    const hex = color.replace('#', '');
    const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + amount);
    const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + amount);
    const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + amount);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  },
  
  // 어둡게 조정
  darken: (color, amount) => {
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - amount);
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - amount);
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - amount);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
};

// 테마 설정
export const Theme = {
  colors: Colors,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 50,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: 'bold',
      lineHeight: 40,
    },
    h2: {
      fontSize: 24,
      fontWeight: 'bold',
      lineHeight: 32,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
    },
    h4: {
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 24,
    },
    body: {
      fontSize: 16,
      lineHeight: 24,
    },
    caption: {
      fontSize: 14,
      lineHeight: 20,
    },
    small: {
      fontSize: 12,
      lineHeight: 16,
    },
  },
  shadows: {
    small: {
      shadowColor: Colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: Colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 4,
    },
    large: {
      shadowColor: Colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
  },
};
