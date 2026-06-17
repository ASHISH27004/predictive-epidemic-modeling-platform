# EpidemicModel Pro — Predictive Epidemic Modeling Platform

A comprehensive web platform for modeling viral transmissions across global nodes using an extended SEIR (Susceptible-Exposed-Infectious-Recovered) differential equations solver with spatial spread simulation.

![Platform Preview](https://img.shields.io/badge/status-production-ready-brightgreen)
![Tech](https://img.shields.io/badge/Python-FastAPI-blue)
![Tech](https://img.shields.io/badge/React-Vite-61dafb)
![Math](https://img.shields.io/badge/Math-SEIR--ODE-purple)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        EpidemicModel Pro                        │
├──────────────────┬──────────────────────────┬───────────────────┤
│   Frontend       │      Backend API         │   Math Engine     │
│   (React+Vite)   │    (FastAPI)             │   (SciPy+NumPy)   │
│                  │                          │                   │
│  ┌────────────┐  │  ┌────────────────────┐  │  ┌─────────────┐  │
│  │  Leaflet   │  │  │  /api/simulate    │  │  │  SEIR Solver │  │
│  │  Map View  │◄─┼──┤  /api/graph       │◄─┼──┤  (odeint)    │  │
│  │  (Dark)    │  │  │  /api/cities      │  │  └─────────────┘  │
│  └────────────┘  │  │  /api/routes      │  │  ┌─────────────┐  │
│  ┌────────────┐  │  └────────────────────┘  │  │  NetworkX    │  │
│  │  Recharts  │  │                          │  │  (Graph)     │  │
│  │  Forecasts │  │  ┌────────────────────┐  │  └─────────────┘  │
│  └────────────┘  │  │  Celery Workers    │  │  ┌─────────────┐  │
│  ┌────────────┐  │  │  (Background Jobs) │  │  │  Climate     │  │
│  │ Controls   │  │  └────────────────────┘  │  │  Modulators  │  │
│  │ Scenario   │  │                          │  └─────────────┘  │
│  │ Sandbox    │  │  ┌────────────────────┐  │                   │
│  └────────────┘  │  │  Redis Broker      │  │                   │
│                  │  └────────────────────┘  │                   │
└──────────────────┴──────────────────────────┴───────────────────┘
```

## Features

### Mathematical Engine
- **Extended SEIR Model**: Susceptible → Exposed → Infectious → Recovered + Deceased
- **RK4 / SciPy odeint**: Numerical ODE integration with adaptive stepping
- **Climate Modulation**: Temperature and humidity effects on transmission rate β
- **Vaccination Dynamics**: Vaccine rollout with configurable efficacy

### Spatial Spread
- **25 Global Mega-Cities**: From New York to Nairobi
- **60+ Flight Routes**: Weighted by weekly passenger volume
- **NetworkX Graph**: City-to-city transport network
- **Infection Cascades**: Pathogen spread through mobility flows

### Interactive Dashboard
- **Dark Scientific UI**: Clinical teal and warning amber palettes
- **Leaflet Dark Map**: CartoDB dark basemap with infection-colored nodes
- **Real-Time Charts**: Multi-panel SEIR trajectory visualization
- **Timeline Playback**: Day-by-day epidemic progression (Day 1 → 180)
- **Scenario Sandbox**: Live parameter adjustment with auto-recalculation

### Intervention Simulation
- **Border Restrictions**: Cross-continent travel reduction
- **Flight Bans**: Complete air travel cessation
- **Mask Mandates**: Compliance-adjusted contact reduction
- **Social Isolation**: Mixing rate modulation
- **Mobility Reduction**: General movement restrictions

## Quick Start

### Frontend (Standalone)
```bash
npm install
npm run dev
```

### Full Stack (Docker Compose)
```bash
docker compose 
```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn backend.app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## API Reference

### POST /api/simulate
Run a multi-node SEIR simulation.

```json
{
  "r0": 2.5,
  "incubation_period": 5.2,
  "recovery_period": 10.0,
  "mortality_rate": 0.005,
  "isolation_index": 0.3,
  "mask_compliance": 60,
  "vaccine_rate": 2.0,
  "vaccine_efficacy": 85,
  "border_restrictions": false,
  "flight_ban": false,
  "patient_zero_id": "pek",
  "initial_infections": 0.001,
  "simulation_days": 180,
  "mobility_reduction": 0.1
}
```

### GET /api/graph
Returns the transport network structure (nodes, edges, routes).

### GET /api/cities
Lists all modeled cities with coordinates and demographics.

## Mathematical Model

### SEIR Equations

```
dS/dt = -β·S·I/N - ν·S
dE/dt = β·S·I/N - σ·E
dI/dt = σ·E - γ·I - μ·I
dR/dt = γ·I + ν·S·(1-ε)
dD/dt = μ·I
```

Where:
- **β** = Transmission rate (climate + intervention modulated)
- **σ** = Incubation rate (= 1/incubation_period)
- **γ** = Recovery rate (= 1/recovery_period)
- **μ** = Mortality rate
- **ν** = Vaccination rate
- **ε** = Vaccine efficacy

### Transmission Rate Modulation

```
β_eff = β_base × f_temp × f_humidity × f_mask × f_isolation
```

- **Temperature factor**: Peak at 10-15°C
- **Humidity factor**: Peak at 40-60% RH
- **Mask factor**: Up to 60% reduction at 100% compliance
- **Isolation factor**: Up to 70% reduction

### Basic Reproduction Number

```
R₀ = β / (γ + μ)
```

## Project Structure

```
/epidemic-modeler
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── core/
│   │   │   ├── seir_solver.py   # SciPy odeint solver
│   │   │   └── network.py       # City transport network
│   │   └── api/
│   │       └── endpoints.py     # REST API endpoints
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Geomap.jsx       # Leaflet interactive map
│   │   │   ├── ControlPanel.jsx # Scenario sandbox
│   │   │   └── ChartPanel.jsx   # Forecasting charts
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── deploy.sh
└── README.md
```

## Deployment

### Docker Compose (Local / Staging)
```bash
docker compose up -d
```

### AWS ECS (Production)
```bash
./deploy.sh prod
```

### Vercel (Frontend Only)
```bash
cd frontend
vercel --prod
```

## Verification

### Population Conservation
The solver verifies that S + E + I + R + D = N at all timepoints.
Maximum population drift should be < 1% of total population.

### Test Suite
```bash
cd backend
python -m pytest tests/ -v
```

## License

MIT

## Acknowledgments

- **SciPy**: Numerical integration (odeint)
- **NetworkX**: Graph theory and network analysis
- **Leaflet**: Open-source interactive maps
- **Recharts**: React charting library
- **FastAPI**: Modern Python web framework
