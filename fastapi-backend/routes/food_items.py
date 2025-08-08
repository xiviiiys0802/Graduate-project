from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from models.food_item import FoodItemCreate, FoodItemUpdate, FoodItemResponse
from services.firestore import firestore_service
from middleware.auth import get_current_user

router = APIRouter(prefix="/api/food-items", tags=["food-items"])

@router.post("/", response_model=dict)
async def create_food_item(
    food_item: FoodItemCreate,
    current_user: dict = Depends(get_current_user)
):
    """음식 아이템 생성"""
    try:
        item_id = firestore_service.create_food_item(current_user['uid'], food_item)
        return {"id": item_id, "message": "음식 아이템이 생성되었습니다."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/", response_model=List[dict])
async def get_food_items(current_user: dict = Depends(get_current_user)):
    """사용자의 음식 아이템 목록 조회"""
    try:
        items = firestore_service.get_food_items(current_user['uid'])
        return items
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/{item_id}", response_model=dict)
async def get_food_item(
    item_id: str,
    current_user: dict = Depends(get_current_user)
):
    """특정 음식 아이템 조회"""
    try:
        item = firestore_service.get_food_item(current_user['uid'], item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="음식 아이템을 찾을 수 없습니다."
            )
        return item
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.put("/{item_id}", response_model=dict)
async def update_food_item(
    item_id: str,
    update_data: FoodItemUpdate,
    current_user: dict = Depends(get_current_user)
):
    """음식 아이템 수정"""
    try:
        success = firestore_service.update_food_item(current_user['uid'], item_id, update_data)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="음식 아이템을 찾을 수 없습니다."
            )
        return {"message": "음식 아이템이 수정되었습니다."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.delete("/{item_id}", response_model=dict)
async def delete_food_item(
    item_id: str,
    current_user: dict = Depends(get_current_user)
):
    """음식 아이템 삭제"""
    try:
        firestore_service.delete_food_item(current_user['uid'], item_id)
        return {"message": "음식 아이템이 삭제되었습니다."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )