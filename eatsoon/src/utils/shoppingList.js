// src/utils/shoppingList.js
import { collection, doc, getDocs, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
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


