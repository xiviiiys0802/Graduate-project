from typing import List, Optional, Dict, Any
from datetime import datetime
from config.firebase import get_firestore_client
from models.food_item import FoodItemCreate, FoodItemUpdate, FoodItemResponse

class FirestoreService:
    def __init__(self):
        self.db = get_firestore_client()
    
    def create_food_item(self, user_id: str, food_item: FoodItemCreate) -> str:
        """음식 아이템 생성"""
        doc_ref = self.db.collection('users').document(user_id).collection('food_items').document()
        
        data = {
            **food_item.dict(),
            'added_date': datetime.now().isoformat(),
            'user_id': user_id,
            'id': doc_ref.id
        }
        
        doc_ref.set(data)
        return doc_ref.id
    
    def get_food_items(self, user_id: str) -> List[Dict[str, Any]]:
        """사용자의 음식 아이템 목록 조회"""
        docs = self.db.collection('users').document(user_id).collection('food_items').stream()
        return [doc.to_dict() for doc in docs]
    
    def get_food_item(self, user_id: str, item_id: str) -> Optional[Dict[str, Any]]:
        """특정 음식 아이템 조회"""
        doc = self.db.collection('users').document(user_id).collection('food_items').document(item_id).get()
        return doc.to_dict() if doc.exists else None
    
    def update_food_item(self, user_id: str, item_id: str, update_data: FoodItemUpdate) -> bool:
        """음식 아이템 수정"""
        doc_ref = self.db.collection('users').document(user_id).collection('food_items').document(item_id)
        
        # None이 아닌 필드만 업데이트
        update_fields = {k: v for k, v in update_data.dict().items() if v is not None}
        
        if update_fields:
            doc_ref.update(update_fields)
            return True
        return False
    
    def delete_food_item(self, user_id: str, item_id: str) -> bool:
        """음식 아이템 삭제"""
        doc_ref = self.db.collection('users').document(user_id).collection('food_items').document(item_id)
        doc_ref.delete()
        return True

# 싱글톤 인스턴스
firestore_service = FirestoreService()