import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, Keyboard, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Theme } from '../utils/colors';

const SearchInput = ({ 
  searchQuery, 
  onSearchChange, 
  onClearSearch, 
  placeholder = "음식명이나 카테고리로 검색..." 
}) => {
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const debounceTimeout = useRef(null);
  const textInputRef = useRef(null);
  const isFocusedRef = useRef(false);
  const shouldMaintainFocus = useRef(false);

  // 외부 상태와 동기화 (포커스 상태에서는 동기화하지 않음)
  useEffect(() => {
    if (!isFocusedRef.current) {
      setLocalQuery(searchQuery);
    }
  }, [searchQuery]);

  // 디바운싱된 검색 처리
  const handleTextChange = useCallback((text) => {
    setLocalQuery(text);
    
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    debounceTimeout.current = setTimeout(() => {
      onSearchChange(text);
    }, 200);
  }, [onSearchChange]);

  // 즉시 검색 실행
  const handleSearchPress = useCallback(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    onSearchChange(localQuery);
  }, [localQuery, onSearchChange]);

  // 키보드 이벤트 리스너
  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      if (shouldMaintainFocus.current && textInputRef.current && isFocusedRef.current) {
        setTimeout(() => {
          textInputRef.current?.focus();
        }, 100);
      }
    });

    const keyboardWillHideListener = Platform.OS === 'ios' 
      ? Keyboard.addListener('keyboardWillHide', () => {
          if (shouldMaintainFocus.current && textInputRef.current && isFocusedRef.current) {
            setTimeout(() => {
              textInputRef.current?.focus();
            }, 50);
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

  const handleFocus = useCallback(() => {
    isFocusedRef.current = true;
    shouldMaintainFocus.current = true;
  }, []);

  const handleBlur = useCallback(() => {
    if (shouldMaintainFocus.current && textInputRef.current) {
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 50);
    } else {
      isFocusedRef.current = false;
    }
  }, []);

  const handleClear = useCallback(() => {
    setLocalQuery('');
    onClearSearch();
    if (textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [onClearSearch]);

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

export default React.memo(SearchInput);
