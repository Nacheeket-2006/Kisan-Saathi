from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import get_settings
from database import connect_db, close_db

# Import all routers
from routes.auth import router as auth_router
from routes.transport import router as transport_router
from routes.chat import router as chat_router
from routes.diagnosis import router as diagnosis_router
from routes.mandi import router as mandi_router
from routes.context import router as context_router
from routes.community import router as community_router
from routes.weather import router as weather_router

# Import startup tasks for services that need initialisation
from services.transport_service import create_ttl_index
from services.weather_service import start_weather_scheduler

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──────────────────────────────────────────────────────────
    await connect_db()
    await create_ttl_index()       # Transport listings expire after 24 h
    start_weather_scheduler()      # Refresh weather cache every 3 hours
    yield
    # ── Shutdown ─────────────────────────────────────────────────────────
    await close_db()


app = FastAPI(
    title="Kisan-Sathi API",
    description=(
        "Backend API for the Kisan-Sathi agricultural platform. "
        "Serves Farmer, Driver, and Owner roles with features including "
        "transport listings, AI chat, disease diagnosis, mandi prices, "
        "community feed, and weather alerts."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://kisan-saathi-mu.vercel.app", "https://kisan-sathi.vercel.app", "https://kisan-sathi.onrender.com"].extend(settings.allowed_origins_list),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router,       prefix="/auth",      tags=["Auth"])
app.include_router(transport_router,  prefix="/transport", tags=["Transport Shoutbox"])
app.include_router(chat_router,       prefix="/chat",      tags=["Kisan Mitra (AI Chat)"])
app.include_router(diagnosis_router,  prefix="/diagnosis", tags=["Disease Diagnosis"])
app.include_router(mandi_router,      prefix="/mandi",     tags=["Mandi Tracker"])
app.include_router(context_router,    prefix="/context",   tags=["Context Engine"])
app.include_router(community_router,  prefix="/community", tags=["Community Feed"])
app.include_router(weather_router,    prefix="/weather",   tags=["Weather Alerts"])


@app.get("/", tags=["Health"])
async def root():
    return {"message": "🌾 Kisan-Sathi API is running!", "docs": "/docs"}
