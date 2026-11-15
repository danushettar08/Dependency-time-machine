from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.dependency_routes import router as dependency_router


app = FastAPI(
    title="Dependency Time Machine",
    description="An AI-powered software dependency risk analyzer.",
    version="1.0.0"
)


# Allow React frontend to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register API routes
app.include_router(dependency_router)


@app.get("/")
def home():
    return {
        "message": "Welcome to Dependency Time Machine!",
        "status": "Running",
        "project": "Dependency Time Machine"
    }


@app.get("/health")
def health_check():
    return {
        "status": "Healthy",
        "backend": "Operational"
    }