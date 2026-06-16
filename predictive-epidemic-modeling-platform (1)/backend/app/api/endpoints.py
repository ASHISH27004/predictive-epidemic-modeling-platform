"""
API Endpoints for the Epidemic Modeling Platform

Provides REST endpoints for simulation, parameter tuning, and results retrieval.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

try:
    from ..core.network import run_multi_node_simulation, build_transport_graph, CITIES, FLIGHT_ROUTES
except Exception:
    # Simulation dependencies are optional for auth/history testing; return placeholders
    run_multi_node_simulation = None
    build_transport_graph = None
    CITIES = []
    FLIGHT_ROUTES = []


router = APIRouter()


class SimulationRequest(BaseModel):
    """Request body for /api/simulate endpoint."""
    r0: float = Field(default=2.5, description="Basic reproduction number", ge=0.1, le=10)
    incubation_period: float = Field(default=5.2, description="Incubation period in days", gt=0)
    recovery_period: float = Field(default=10.0, description="Recovery period in days", gt=0)
    mortality_rate: float = Field(default=0.005, description="Case fatality rate", ge=0, le=1)
    isolation_index: float = Field(default=0, description="Global isolation level (0-1)", ge=0, le=1)
    mask_compliance: float = Field(default=0, description="Mask mandate compliance (%)", ge=0, le=100)
    vaccine_rate: float = Field(default=0, description="Daily vaccination rate (%)", ge=0, le=100)
    vaccine_efficacy: float = Field(default=85, description="Vaccine efficacy (%)", ge=0, le=100)
    border_restrictions: bool = Field(default=False, description="Apply border restrictions")
    flight_ban: bool = Field(default=False, description="Full flight ban")
    patient_zero_id: str = Field(default="pek", description="Patient zero city ID")
    initial_infections: float = Field(default=0.001, description="Initial infected count (millions)", gt=0)
    simulation_days: int = Field(default=180, description="Simulation duration in days", ge=1, le=730)
    mobility_reduction: float = Field(default=0, description="Mobility reduction (0-1)", ge=0, le=1)


class GraphInfoResponse(BaseModel):
    """Response for network graph information."""
    nodes: int
    edges: int
    cities: list
    routes: list


@router.post("/simulate")
async def simulate(request: SimulationRequest):
    """
    Run a multi-node SEIR epidemic simulation.
    
    Accepts pathogen properties, intervention parameters, and initial conditions.
    Returns daily projections of S/E/I/R/D populations per city.
    """
    try:
        params = {
            "r0": request.r0,
            "sigma": 1 / request.incubation_period,
            "gamma": 1 / request.recovery_period,
            "mu": request.mortality_rate,
            "isolation_index": request.isolation_index,
            "mask_compliance": request.mask_compliance,
            "vaccine_rate": request.vaccine_rate,
            "vaccine_efficacy": request.vaccine_efficacy,
            "border_restrictions": request.border_restrictions,
            "flight_ban": request.flight_ban,
            "patient_zero_id": request.patient_zero_id,
            "initial_infections": request.initial_infections,
            "simulation_days": request.simulation_days,
            "mobility_reduction": request.mobility_reduction,
        }

        if run_multi_node_simulation is None:
            raise HTTPException(status_code=503, detail="Simulation dependencies not installed on server")
        result = run_multi_node_simulation(params)
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")


@router.get("/graph")
async def get_graph_info():
    """Return the transport network graph structure."""
    if build_transport_graph is None:
        raise HTTPException(status_code=503, detail="Graph dependencies not installed on server")
    G = build_transport_graph()
    return {
        "nodes": G.number_of_nodes(),
        "edges": G.number_of_edges(),
        "cities": CITIES,
        "routes": [{"from": f, "to": t, "weekly_pax": d["weekly_pax"]} for f, t, d in G.edges(data=True)],
    }


@router.get("/cities")
async def list_cities():
    """List all modeled cities with coordinates and demographics."""
    return CITIES


@router.get("/routes")
async def list_routes():
    """List all flight routes with passenger volumes."""
    return [{"from": f, "to": t, "weekly_pax": p} for f, t, p in FLIGHT_ROUTES]
