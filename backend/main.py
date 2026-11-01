from fastapi import FastAPI
from app.routes.health import router as health_router
from app.routes.prediction import router as prediction_router
from app.routes.clinical_records import router as records_router
from auth.routes import router as auth_router
from fastapi.middleware.cors import CORSMiddleware
app=FastAPI()   #CREATE object of the class
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router)
app.include_router(health_router)  # Add router in Fastapi application 
app.include_router(prediction_router)
app.include_router(records_router)
