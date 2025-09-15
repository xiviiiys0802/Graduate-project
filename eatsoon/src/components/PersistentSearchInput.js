import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, Keyboard, Platform, AppState } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Theme } from '../utils/colors';

// 전역 검색 상태 관리
let globalSearchQuery = '';
let globalSearchCallbacks = [];

const setGlobalSearchQuery = (query) => {
  globalSearchQuery = query;
  globalSearchCallbacks.forEach(callback => callback(query));
};

const addGlobalSearchCallback = (callback) => {
  globalSearchCallbacks.push(callback);
  return () => {
    globalSearchCallbacks = globalSearchCallbacks.filter(cb => cb !== callback);
  };
};

const PersistentSearchInput = ({ placeholder = "음식명이나 카테고리로 검색..." }) => {
  const [localQuery, setLocalQuery] = useState(globalSearchQuery);
  const debounceTimeout = useRef(null);
  const textInputRef = useRef(null);
  const isFocusedRef = useRef(false);
  const shouldMaintainFocus = useRef(false);
  const appState = useRef(AppState.currentState);

  // 전역 상태와 동기화
  useEffect(() => {
    const unsubscribe = addGlobalSearchCallback((query) => {
      if (!isFocusedRef.current) {
        setLocalQuery(query);
      }
    });
    return unsubscribe;
  }, []);

  // 앱 상태 변화 감지
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // 앱이 다시 활성화되면 포커스 복구
        if (shouldMaintainFocus.current && textInputRef.current) {
          setTimeout(() => {
            textInputRef.current?.focus();
          }, 200);
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  // 디바운싱된 검색 처리
  const handleTextChange = useCallback((text) => {
    setLocalQuery(text);
    
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    debounceTimeout.current = setTimeout(() => {
      setGlobalSearchQuery(text);
    }, 200);
  }, []);

  // 즉시 검색 실행
  const handleSearchPress = useCallback(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    setGlobalSearchQuery(localQuery);
  }, [localQuery]);

  // 키보드 이벤트 리스너 (더 강력한 버전)
  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      if (shouldMaintainFocus.current && textInputRef.current && isFocusedRef.current) {
        setTimeout(() => {
          textInputRef.current?.focus();
        }, 150);
      }
    });

    const keyboardWillHideListener = Platform.OS === 'ios' 
      ? Keyboard.addListener('keyboardWillHide', () => {
          if (shouldMaintainFocus.current && textInputRef.current && isFocusedRef.current) {
            // iOS에서 키보드가 내려가려 할 때 강제로 포커스 유지
            setTimeout(() => {
              textInputRef.current?.focus();
            }, 100);
          }
        })
      : null;

    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      if (shouldMaintainFocus.current && textInputRef.current && !isFocusedRef.current) {
        setTimeout(() => {
          textInputRef.current?.focus();
        }, 50);
      }
    });

    return () => {
      keyboardDidHideListener?.remove();
      keyboardWillHideListener?.remove();
      keyboardDidShowListener?.remove();
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  const handleFocus = useCallback(() => {
    isFocusedRef.current = true;
    shouldMaintainFocus.current = true;
  }, []);

  const handleBlur = useCallback(() => {
    if (shouldMaintainFocus.current && textInputRef.current) {
      // 포커스가 해제되면 즉시 다시 포커스
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);
    } else {
      isFocusedRef.current = false;
    }
  }, []);

  const handleClear = useCallback(() => {
    setLocalQuery('');
    setGlobalSearchQuery('');
    if (textInputRef.current) {
      textInputRef.current.focus();
    }
  }, []);

  // 포커스 유지를 위한 주기적 체크
  useEffect(() => {
    const focusCheckInterval = setInterval(() => {
      if (shouldMaintainFocus.current && textInputRef.current && !isFocusedRef.current) {
        textInputRef.current.focus();
      }
    }, 500);

    return () => clearInterval(focusCheckInterval);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons 
          name="search" 
          size={20} 
          color={Colors.textSecondary} 
          style={styles.searchIcon}
        />
        
        <TextInput
          ref={textInputRef}
          style={styles.searchInput}
          value={localQuery}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor={Colors.textSecondary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          returnKeyType="search"
          onSubmitEditing={handleSearchPress}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="none"
          autoComplete="off"
          blurOnSubmit={false}
          keyboardShouldPersistTaps="handled"
          importantForAutofill="no"
          selectTextOnFocus={false}
          caretHidden={false}
          contextMenuHidden={false}
          multiline={false}
          numberOfLines={1}
          editable={true}
          autoFocus={false}
        />
        
        {localQuery.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton} 
            onPress={handleClear}
          >
            <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = {
  container: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    marginHorizontal: Theme.spacing.sm,
    ...Theme.shadows.small,
  },
  searchIcon: {
    marginRight: Theme.spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: Theme.typography.body.fontSize,
    color: Colors.textPrimary,
    paddingVertical: Theme.spacing.xs,
  },
  clearButton: {
    marginLeft: Theme.spacing.md,
    padding: Theme.spacing.sm,
  },
};

export default React.memo(PersistentSearchInput);
export { setGlobalSearchQuery, addGlobalSearchCallback };

