// screens/ShoppingListScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, FlatList, TouchableOpacity, StyleSheet } from 'react-native';

const ShoppingListScreen = () => {
  const [item, setItem] = useState('');
  const [shoppingList, setShoppingList] = useState([]);

  const addItem = () => {
    if (item.trim()) {
      setShoppingList([...shoppingList, { id: Date.now().toString(), name: item, checked: false }]);
      setItem('');
    }
  };

  const toggleCheck = (id) => {
    setShoppingList(prev =>
      prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i)
    );
  };

  const deleteItem = (id) => {
    setShoppingList(prev => prev.filter(i => i.id !== id));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🛒 쇼핑 리스트</Text>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={item}
          onChangeText={setItem}
          placeholder="추가할 재료를 입력하세요"
        />
        <Button title="추가" onPress={addItem} />
      </View>

      <FlatList
        data={shoppingList}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => toggleCheck(item.id)}
            onLongPress={() => deleteItem(item.id)}
          >
            <Text style={{
              padding: 10,
              fontSize: 16,
              textDecorationLine: item.checked ? 'line-through' : 'none',
              color: item.checked ? 'gray' : 'black',
              backgroundColor: '#f9f9f9',
              borderBottomWidth: 1,
              borderColor: '#ddd'
            }}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginRight: 10,
    borderRadius: 5,
  },
});

export default ShoppingListScreen;