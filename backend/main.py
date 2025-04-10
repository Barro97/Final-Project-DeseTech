from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.file_routes import router as file_router
from backend.api.user_routes import router as user_router


#############
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
#############


app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(file_router)
app.include_router(user_router) 

@app.get("/")
async def read_root():
    return {"message": "Welcome to FastAPI backend!"} 