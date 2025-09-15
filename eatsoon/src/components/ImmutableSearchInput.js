import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, Keyboard, Platform, AppState, Dimensions } from 'react-native';
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

const ImmutableSearchInput = ({ placeholder = "음식명이나 카테고리로 검색..." }) => {
  const [localQuery, setLocalQuery] = useState(globalSearchQuery);
  const debounceTimeout = useRef(null);
  const textInputRef = useRef(null);
  const isFocusedRef = useRef(false);
  const shouldMaintainFocus = useRef(false);
  const isSearching = useRef(false); // 검색 중인지 추적
  const appState = useRef(AppState.currentState);
  const focusInterval = useRef(null);
  const keyboardInterval = useRef(null);

  // 전역 상태와 동기화
  useEffect(() => {
    const unsubscribe = addGlobalSearchCallback((query) => {
      if (!isFocusedRef.current) {
        setLocalQuery(query);
      }
    });
    return unsubscribe;
  }, []);

  // 디바운싱된 검색 처리
  const handleTextChange = useCallback((text) => {
    setLocalQuery(text);
    
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    // 검색 시작
    isSearching.current = true;
    
    debounceTimeout.current = setTimeout(() => {
      setGlobalSearchQuery(text);
      // 검색 완료 후 잠시 후 검색 상태 해제
      setTimeout(() => {
        isSearching.current = false;
        // 검색이 완료되면 키보드 해제
        if (textInputRef.current) {
          textInputRef.current.blur();
        }
      }, 3000); // 3초 후 검색 상태 해제 및 키보드 해제
    }, 200);
  }, []);

  // 즉시 검색 실행
  const handleSearchPress = useCallback(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    setGlobalSearchQuery(localQuery);
  }, [localQuery]);

  // 자연스러운 키보드 관리 시스템
  useEffect(() => {
    // 1. 키보드 이벤트 리스너 - 최소한의 처리
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      if (shouldMaintainFocus.current && textInputRef.current && isFocusedRef.current && isSearching.current) {
        // 검색 중일 때만 포커스 복구 (더 긴 지연)
        setTimeout(() => {
          textInputRef.current?.focus();
        }, 300); // 300ms로 증가하여 자연스럽게
      }
    });

    const keyboardWillHideListener = Platform.OS === 'ios' 
      ? Keyboard.addListener('keyboardWillHide', () => {
          if (shouldMaintainFocus.current && textInputRef.current && isFocusedRef.current && isSearching.current) {
            // 검색 중일 때만 키보드 차단 (더 긴 지연)
            setTimeout(() => {
              textInputRef.current?.focus();
            }, 200); // 200ms로 증가하여 자연스럽게
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

    // 2. 키보드가 내려가려 할 때 즉시 차단
    const keyboardWillShowListener = Platform.OS === 'ios' 
      ? Keyboard.addListener('keyboardWillShow', () => {
          if (shouldMaintainFocus.current && textInputRef.current) {
            // 키보드가 올라올 때 포커스 확실히 유지
            setTimeout(() => {
              textInputRef.current?.focus();
            }, 20);
          }
        })
      : null;

    // 2. 앱 상태 변화 감지
    const handleAppStateChange = (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (shouldMaintainFocus.current && textInputRef.current && isSearching.current) {
          setTimeout(() => {
            textInputRef.current?.focus();
          }, 500);
        }
      }
      appState.current = nextAppState;
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    // 3. 주기적 체크 완전 제거 (움찔움찔 현상 원인)
    // focusInterval과 keyboardInterval 제거

    return () => {
      keyboardDidHideListener?.remove();
      keyboardWillHideListener?.remove();
      keyboardDidShowListener?.remove();
      keyboardWillShowListener?.remove();
      appStateSubscription?.remove();
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
    if (shouldMaintainFocus.current && textInputRef.current && isSearching.current) {
      // 검색 중일 때만 포커스가 해제되면 다시 포커스 (더 긴 지연)
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 200); // 200ms로 증가하여 자연스럽게
    } else {
      isFocusedRef.current = false;
    }
  }, []);

  const handleClear = useCallback(() => {
    setLocalQuery('');
    setGlobalSearchQuery('');
    isSearching.current = false; // 검색 상태 해제
    if (textInputRef.current) {
      textInputRef.current.focus();
    }
  }, []);

  // 검색 종료 시 키보드 해제 함수
  const handleSearchEnd = useCallback(() => {
    isSearching.current = false;
    shouldMaintainFocus.current = false;
    if (textInputRef.current) {
      textInputRef.current.blur();
    }
  }, []);

  // 컴포넌트 마운트 시 자동 포커스
  useEffect(() => {
    const timer = setTimeout(() => {
      if (textInputRef.current) {
        textInputRef.current.focus();
      }
    }, 500);
    return () => clearTimeout(timer);
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
          autoFocus={true}
          keyboardType="default"
          secureTextEntry={false}
          maxLength={100}
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

export default React.memo(ImmutableSearchInput);
export { setGlobalSearchQuery, addGlobalSearchCallback };
