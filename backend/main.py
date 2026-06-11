"""Punto de entrada de la aplicación FastAPI."""

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routers import auth, contenido, productos
from backend.routers.admin import contenido as admin_contenido
from backend.routers.admin import productos as admin_productos

app = FastAPI(title="Amishi API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(productos.router)
app.include_router(contenido.router)
app.include_router(auth.router)
app.include_router(admin_productos.router)
app.include_router(admin_contenido.router)
