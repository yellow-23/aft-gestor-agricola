import os
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

import models
from database import engine, get_db
from auth import authenticate_user, create_access_token, verify_token
from schemas import LoginRequest, TokenResponse
from routers import fundos, trabajadores, contratos

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AFT Servicios SpA — API",
    description="Sistema de gestión de trabajadores agrícolas.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — leer orígenes desde .env
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5174")
allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── AUTH ─────────────────────────────────────────────────────────────────────

@app.post("/auth/login", response_model=TokenResponse, tags=["Auth"])
def login(data: LoginRequest):
    if not authenticate_user(data.username, data.password):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    token = create_access_token({"sub": data.username})
    return TokenResponse(access_token=token)


@app.get("/auth/me", tags=["Auth"])
def me(username: str = Depends(verify_token)):
    return {"username": username, "empresa": "AFT Servicios SpA"}


@app.get("/", tags=["Health"])
def health():
    return {"status": "ok", "app": "AFT Backend", "version": "1.0.0"}


app.include_router(fundos.router)
app.include_router(trabajadores.router)
app.include_router(contratos.router)
