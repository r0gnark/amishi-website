"""Punto de entrada de la aplicación FastAPI."""

import os

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routers import auth, categorias, contenido, media, productos
from backend.routers.admin import categorias as admin_categorias
from backend.routers.admin import contenido as admin_contenido
from backend.routers.admin import media as admin_media
from backend.routers.admin import productos as admin_productos

app = FastAPI(title="Amishi API", version="0.1.0")

# CORS: en desarrollo se usa localhost; en AWS Lambda se leen los orígenes de CORS_ORIGINS.
_cors_env = os.getenv("CORS_ORIGINS", "")
_cors_origins = [o.strip() for o in _cors_env.split(",") if o.strip()] or ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(productos.router)
app.include_router(categorias.router)
app.include_router(contenido.router)
app.include_router(media.router)
app.include_router(auth.router)
app.include_router(admin_productos.router)
app.include_router(admin_contenido.router)
app.include_router(admin_media.router)
app.include_router(admin_categorias.router)

# Handler para AWS Lambda (Mangum adapta el ASGI app al protocolo de Lambda).
# En desarrollo local mangum no es necesario, por eso el import es opcional.
try:
    from mangum import Mangum
    handler = Mangum(app, lifespan="off")
except ImportError:
    handler = None  # Solo disponible en Lambda; en local se usa uvicorn
