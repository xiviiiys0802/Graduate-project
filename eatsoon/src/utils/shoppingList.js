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

// Add a single item
export async function addItem(name, quantity = 1, unit = '개') {
  const colRef = itemsCollectionRef();
  const id = doc(colRef).id;
  
  await setDoc(doc(colRef, id), {
    name: name.trim(),
    quantity: Number(quantity),
    unit: unit.trim(),
    checked: false,
    fromRecipeId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  return id;
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


