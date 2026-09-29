from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import logging
import time
import os
from contextlib import asynccontextmanager

from app.api.routes import api_router
from app.core.config import settings
from app.db.init_db import init_db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database on startup
    logger.info("Initializing database")
    await init_db()
    
    # Run setup scripts to create admin and seed data
    try:
        import sys
        # ensure the root backend path is in sys.path
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        if backend_dir not in sys.path:
            sys.path.insert(0, backend_dir)

        import create_admin
        import seed_db
        
        logger.info("Setting up admin user...")
        await create_admin.create_admin()
        
        logger.info("Running database seeder...")
        seed_db.seed_database()
    except Exception as e:
        logger.error(f"Error running setup scripts: {e}", exc_info=True)

    yield
    # Cleanup on shutdown
    logger.info("Shutting down application")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API for El Comité PDCA application",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Add middleware for request logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    logger.info(f"{request.method} {request.url.path} - {response.status_code} - {process_time:.4f}s")
    return response


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"success": False, "message": "Error interno del servidor"},
    )


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "message": "Server is running"}


# Include all API routes
app.include_router(api_router, prefix="/api")

# Serve static files from uploads directory
app.mount("/uploads", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "uploads")), name="uploads")


# 404 handler
@app.exception_handler(404)
async def not_found_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"success": False, "message": "Ruta no encontrada"},
    )
