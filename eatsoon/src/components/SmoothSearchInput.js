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

const SmoothSearchInput = ({ placeholder = "음식명이나 카테고리로 검색..." }) => {
  const [localQuery, setLocalQuery] = useState(globalSearchQuery);
  const textInputRef = useRef(null);
  const isFocusedRef = useRef(false);

  // 전역 상태와 동기화
  useEffect(() => {
    const unsubscribe = addGlobalSearchCallback((query) => {
      if (!isFocusedRef.current) {
        setLocalQuery(query);
      }
    });
    return unsubscribe;
  }, []);

  // 간단한 텍스트 변경 처리 (실시간 검색 제거)
  const handleTextChange = useCallback((text) => {
    setLocalQuery(text);
    // 실시간 검색 제거 - 검색 버튼을 눌렀을 때만 검색
  }, []);

  // 검색 버튼 클릭 시 검색 실행
  const handleSearchPress = useCallback(() => {
    // 검색 실행
    setGlobalSearchQuery(localQuery);
    
    // 검색 후 키보드 해제
    if (textInputRef.current) {
      textInputRef.current.blur();
    }
  }, [localQuery]);

  // 간단한 포커스 핸들러
  const handleFocus = useCallback(() => {
    isFocusedRef.current = true;
  }, []);

  const handleBlur = useCallback(() => {
    isFocusedRef.current = false;
  }, []);

  const handleSearchContainerPress = useCallback(() => {
    // 검색창 터치 시 포커스 활성화
    if (textInputRef.current) {
      textInputRef.current.focus();
    }
  }, []);

  const handleClear = useCallback(() => {
    setLocalQuery('');
    setGlobalSearchQuery('');
    if (textInputRef.current) {
      textInputRef.current.focus();
    }
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.searchContainer, isFocusedRef.current && styles.searchContainerFocused]}
        onPress={handleSearchContainerPress}
        activeOpacity={0.7}
      >
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
          keyboardType="default"
          secureTextEntry={false}
          maxLength={100}
          keyboardDismissMode="none"
        />
        
        {localQuery.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton} 
            onPress={handleClear}
          >
            <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = {
  container: {
    paddingHorizontal: 4,
    paddingVertical: 0,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
};

export default React.memo(SmoothSearchInput);
export { setGlobalSearchQuery, addGlobalSearchCallback };
