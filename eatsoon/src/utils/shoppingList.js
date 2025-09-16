// src/utils/shoppingList.js
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

function requireUid() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('로그인이 필요합니다.');
  return uid;
}

function itemsCollectionRef() {
  const uid = requireUid();
  return collection(db, `users/${uid}/shopping_list`);
}

// Add a single item (with quantity merging for same names)
export async function addItem(name, quantity = 1, unit = '개') {
  const colRef = itemsCollectionRef();
  const trimmedName = name.trim();
  const trimmedUnit = unit.trim();
  const numQuantity = Number(quantity);
  
  // Check if item with same name already exists
  const existingItems = await getDocs(colRef);
  const existingItem = existingItems.docs.find(doc => {
    const data = doc.data();
    return data.name === trimmedName && data.unit === trimmedUnit;
  });
  
  if (existingItem) {
    // Update existing item quantity
    const currentQuantity = existingItem.data().quantity || 0;
    const newQuantity = currentQuantity + numQuantity;
    
    await updateDoc(doc(colRef, existingItem.id), {
      quantity: newQuantity,
      updatedAt: serverTimestamp(),
    });
    
    console.log(`📝 기존 재료 수량 업데이트: ${trimmedName} (${currentQuantity} + ${numQuantity} = ${newQuantity}${trimmedUnit})`);
    return existingItem.id;
  } else {
    // Create new item
    const id = doc(colRef).id;
    
    await setDoc(doc(colRef, id), {
      name: trimmedName,
      quantity: numQuantity,
      unit: trimmedUnit,
      checked: false,
      fromRecipeId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    console.log(`➕ 새 재료 추가: ${trimmedName} (${numQuantity}${trimmedUnit})`);
    return id;
  }
}

// Toggle check status
export async function toggleCheck(itemId) {
  const colRef = itemsCollectionRef();
  const itemRef = doc(colRef, itemId);
  
  // Get current item to toggle checked status
  const snap = await getDocs(colRef);
  const item = snap.docs.find(d => d.id === itemId);
  
  if (!item) throw new Error('항목을 찾을 수 없습니다.');
  
  const currentData = item.data();
  await updateDoc(itemRef, {
    checked: !currentData.checked,
    updatedAt: serverTimestamp(),
  });
}

// Update item
export async function updateItem(itemId, updates) {
  const colRef = itemsCollectionRef();
  const itemRef = doc(colRef, itemId);
  
  await updateDoc(itemRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// Delete item
export async function deleteItem(itemId) {
  const colRef = itemsCollectionRef();
  const itemRef = doc(colRef, itemId);
  
  await deleteDoc(itemRef);
}

// List all items with real-time subscription
export function listAll(callback) {
  const colRef = itemsCollectionRef();
  
  return onSnapshot(colRef, (snapshot) => {
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(items);
  }, (error) => {
    console.error('Shopping list subscription error:', error);
    callback([]);
  });
}

// Mark all items as checked
export async function markAllChecked() {
  const colRef = itemsCollectionRef();
  const snap = await getDocs(colRef);
  
  const updatePromises = snap.docs
    .filter(doc => !doc.data().checked)
    .map(doc => updateDoc(doc.ref, {
      checked: true,
      updatedAt: serverTimestamp(),
    }));
  
  await Promise.all(updatePromises);
}

// Delete all checked items
export async function deleteAllChecked() {
  const colRef = itemsCollectionRef();
  const snap = await getDocs(colRef);
  
  const deletePromises = snap.docs
    .filter(doc => doc.data().checked)
    .map(doc => deleteDoc(doc.ref));
  
  await Promise.all(deletePromises);
}

// Add many items; merge by name+unit if unchecked item exists, increment quantity
export async function addItemsMerged(missing = [], { recipeId } = {}) {
  const colRef = itemsCollectionRef();
  const snap = await getDocs(colRef);
  const existing = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  for (const m of missing) {
    const name = (m.name || '').trim();
    const unit = (m.unit || '').trim();
    const qty = Number(m.quantity ?? 1);

    const found = existing.find(
      it => (it.name || '').trim().toLowerCase() === name.toLowerCase()
        && ((it.unit || '').trim() === unit)
        && !it.checked
    );

    if (found) {
      await updateDoc(doc(colRef, found.id), {
        quantity: Number(found.quantity ?? 0) + qty,
        updatedAt: serverTimestamp(),
      });
    } else {
      const id = doc(colRef).id;
      await setDoc(doc(colRef, id), {
        name,
        unit,
        quantity: qty,
        checked: false,
        fromRecipeId: recipeId || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }
}


