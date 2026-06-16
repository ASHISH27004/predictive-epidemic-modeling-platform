"""
FastAPI Application Entry Point

Predictive Epidemic Modeling Platform — Math Engine API
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import endpoints
from .api import auth_history

app = FastAPI(
    title="EpidemicModel Pro API",
    description="Predictive Epidemic Modeling Platform — SEIR differential equations solver with spatial spread",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(endpoints.router, prefix="/api", tags=["simulation"])
app.include_router(auth_history.router, prefix="/api", tags=["auth", "history"])


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "epidemic-modeler-backend"}
