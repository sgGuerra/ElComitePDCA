from fastapi import APIRouter

from app.api.endpoints import auth, users, processes, actions, notifications, statistics

api_router = APIRouter()

# Include all API endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(processes.router, prefix="/processes", tags=["Processes"])
api_router.include_router(actions.router, prefix="/actions", tags=["Actions"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(statistics.router, prefix="/statistics", tags=["Statistics"])
