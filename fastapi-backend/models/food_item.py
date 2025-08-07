from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class FoodItemBase(BaseModel):
    name: str
    expiration_date: str
    quantity: int = 1
    category: Optional[str] = None

class FoodItemCreate(FoodItemBase):
    pass

class FoodItemUpdate(BaseModel):
    name: Optional[str] = None
    expiration_date: Optional[str] = None
    quantity: Optional[int] = None
    category: Optional[str] = None

class FoodItemResponse(FoodItemBase):
    id: str
    added_date: str
    user_id: str
    
    class Config:
        from_attributes = True