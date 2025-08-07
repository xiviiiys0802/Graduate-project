from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.food_items import router as food_items_router

app = FastAPI(title="음식물 재고 관리 API", version="1.0.0")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 실제 배포시에는 특정 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(food_items_router)

@app.get("/")
async def root():
    return {"message": "음식물 재고 관리 API 서버가 실행 중입니다."}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)