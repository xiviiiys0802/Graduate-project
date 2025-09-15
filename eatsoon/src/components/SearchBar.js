import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, Text, Keyboard, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Theme } from '../utils/colors';

const SearchBar = ({ 
  searchQuery, 
  onSearchChange, 
  onClearSearch, 
  placeholder = "음식명이나 카테고리로 검색..." 
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const debounceTimeout = useRef(null);
  const textInputRef = useRef(null);
  const isInitialMount = useRef(true);
  const shouldMaintainFocus = useRef(false);

  // 외부에서 searchQuery가 변경될 때 로컬 상태 동기화 (포커스 상태 유지)
  useEffect(() => {
    if (!isFocused && !isInitialMount.current) {
      setLocalQuery(searchQuery);
    }
    isInitialMount.current = false;
  }, [searchQuery, isFocused]);

  // 디바운싱된 검색 처리 (useCallback으로 최적화)
  const handleTextChange = useCallback((text) => {
    setLocalQuery(text);
    
    // 기존 타이머 클리어
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    // 200ms 후에 검색 실행 (실시간 부분 매칭 지원)
    debounceTimeout.current = setTimeout(() => {
      onSearchChange(text);
    }, 200);
  }, [onSearchChange]);

  // 즉시 검색 실행 (검색 버튼 클릭 시)
  const handleSearchPress = useCallback(() => {
    // 타이머 클리어
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    // 즉시 검색 실행
    onSearchChange(localQuery);
  }, [localQuery, onSearchChange]);

  // 키보드 이벤트 리스너 및 포커스 유지 로직
  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      if (shouldMaintainFocus.current && textInputRef.current) {
        // 포커스가 해제되면 즉시 다시 포커스
        setTimeout(() => {
          textInputRef.current?.focus();
        }, 50);
      }
    });

    const keyboardWillHideListener = Platform.OS === 'ios' 
      ? Keyboard.addListener('keyboardWillHide', () => {
          if (shouldMaintainFocus.current && textInputRef.current) {
            // iOS에서 키보드가 내려가려 할 때 포커스 유지
            setTimeout(() => {
              textInputRef.current?.focus();
            }, 10);
          }
        })
      : null;

    return () => {
      keyboardDidHideListener?.remove();
      keyboardWillHideListener?.remove();
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  const handleClear = useCallback(() => {
    setLocalQuery('');
    onClearSearch();
    // 포커스 유지
    if (textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [onClearSearch]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    shouldMaintainFocus.current = true;
  }, []);

  const handleBlur = useCallback(() => {
    // 포커스 유지가 필요한 경우 즉시 다시 포커스
    if (shouldMaintainFocus.current && textInputRef.current) {
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 10);
    } else {
      setIsFocused(false);
    }
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.searchContainer, isFocused && styles.searchContainerFocused]}>
        <Ionicons 
          name="search" 
          size={20} 
          color={isFocused ? Colors.primary : Colors.textSecondary} 
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
  searchContainerFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.background,
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

export default React.memo(SearchBar);
