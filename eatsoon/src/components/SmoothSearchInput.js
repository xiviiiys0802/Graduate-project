import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../utils/colors';

const SmoothSearchInput = ({ 
  value, 
  onChangeText, 
  placeholder = "검색...", 
  onFocus, 
  onBlur,
  style 
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const textInputRef = useRef(null);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus && onFocus();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur && onBlur();
  };

  const handleTextChange = (text) => {
    onChangeText && onChangeText(text);
  };

  const handleClear = () => {
    onChangeText && onChangeText('');
    // 포커스 유지
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 100);
  };

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.searchContainer, isFocused && styles.searchContainerFocused]}>
        <Ionicons 
          name="search-outline" 
          size={20} 
          color={isFocused ? Colors.primary : '#999'} 
          style={styles.searchIcon}
        />
        <TextInput
          ref={textInputRef}
          style={styles.searchInput}
          value={value || ''}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor="#999"
          onFocus={handleFocus}
          onBlur={handleBlur}
          returnKeyType="search"
          editable={true}
          selectTextOnFocus={true}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {((value || '').length > 0) && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 4,
    paddingVertical: 0,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 0,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  searchContainerFocused: {
    backgroundColor: '#fff',
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    padding: 4,
    marginLeft: 8,
  },
});

export default SmoothSearchInput;