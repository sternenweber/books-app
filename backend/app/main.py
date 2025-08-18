from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import setup_logging
from app.api import books

logger = setup_logging(settings.LOG_LEVEL)
app = FastAPI(title="Books API", version="0.1.0")

# Whitelist the UI origin(s)
allowed = settings.CORS_ORIGINS or ["http://localhost:8080"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed,          
    allow_credentials=True,        
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

app.include_router(books.router, prefix="/api")
