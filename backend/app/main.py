import logging
import asyncio
from contextlib import asynccontextmanager
from typing import List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database.init_db import init_database
from app.api.routes import (
    health,
    auth,
    incidents,
    resources,
    assignments,
    handover,
    duplicates,
    railway,
    analytics,
    simulator,
    chatbot,
    booking,
    food,
    grocery,
    safety,
    transport,
    tourism,
    travel_guide,
    super_admin,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("railresq")


# WebSocket Connection Manager for Real-time Control-Room updates
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass


ws_manager = ConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("==================================================")
    logger.info("Starting %s v%s", settings.PROJECT_NAME, settings.VERSION)
    logger.info("Initializing RailResQ Database & Seeding Default Data...")
    init_database()
    logger.info("Database and Seeds initialized successfully!")
    logger.info("Environment: %s", settings.ENVIRONMENT)
    logger.info("Academic Prototype Mode Active")
    logger.info("==================================================")
    yield
    logger.info("Shutting down %s", settings.PROJECT_NAME)


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "RailResQ is an AI-powered railway emergency management and coordination platform. "
        "It provides agent-based emergency report understanding, deterministic priority rules, "
        "duplicate detection, response resource dispatching, acknowledgement monitoring, "
        "and intelligent station handover recommendations.\n\n"
        "**Note:** Built as an academic decision-support prototype. "
        "Human operators must review and approve all consequential decisions."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register All API Routers
api_prefix = settings.API_V1_STR
app.include_router(health.router, prefix=api_prefix)
app.include_router(auth.router, prefix=api_prefix)
app.include_router(incidents.router, prefix=api_prefix)
app.include_router(resources.router, prefix=api_prefix)
app.include_router(assignments.router, prefix=api_prefix)
app.include_router(handover.router, prefix=api_prefix)
app.include_router(duplicates.router, prefix=api_prefix)
app.include_router(railway.router, prefix=api_prefix)
app.include_router(analytics.router, prefix=api_prefix)
app.include_router(simulator.router, prefix=api_prefix)
app.include_router(chatbot.router, prefix=api_prefix)
app.include_router(booking.router, prefix=api_prefix)
app.include_router(food.router, prefix=api_prefix)
app.include_router(grocery.router, prefix=api_prefix)
app.include_router(safety.router, prefix=api_prefix)
app.include_router(transport.router, prefix=api_prefix)
app.include_router(tourism.router, prefix=api_prefix)
app.include_router(travel_guide.router, prefix=api_prefix)
app.include_router(super_admin.router, prefix=api_prefix)


@app.websocket("/ws/dashboard")
async def websocket_dashboard_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection open and accept ping / events
            data = await websocket.receive_text()
            # Echo heartbeat or broadcast event
            await websocket.send_json({"type": "PONG", "payload": data})
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)


@app.get("/", tags=["Root"])
async def root():
    return {
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "documentation": {
            "swagger_ui": "/docs",
            "redoc": "/redoc",
            "openapi_json": "/openapi.json"
        },
        "endpoints": {
            "health_check": f"{settings.API_V1_STR}/health",
            "auth": f"{settings.API_V1_STR}/auth",
            "incidents": f"{settings.API_V1_STR}/incidents",
            "resources": f"{settings.API_V1_STR}/resources",
            "assignments": f"{settings.API_V1_STR}/assignments",
            "handover": f"{settings.API_V1_STR}/handover",
            "duplicates": f"{settings.API_V1_STR}/duplicates",
            "railway": f"{settings.API_V1_STR}/railway",
            "analytics": f"{settings.API_V1_STR}/analytics",
            "simulator": f"{settings.API_V1_STR}/simulator",
        },
        "disclaimer": settings.DISCLAIMER
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
