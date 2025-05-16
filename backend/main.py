from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.features.file.api import router as file_router
from backend.app.features.user.api import router as user_router
from backend.app.features.authentication.api import router as auth_router
from backend.app.features.dataset.api import router as dataset_router


#############
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
#############



app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    # allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(file_router)
app.include_router(user_router) 
app.include_router(auth_router) 
app.include_router(dataset_router)
@app.get("/")
async def read_root():
    return {"message": "Welcome to FastAPI backend!"} 