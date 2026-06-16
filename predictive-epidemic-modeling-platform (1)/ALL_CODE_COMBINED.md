# 🎯 COMPLETE PREDICTIVE EPIDEMIC MODELING PLATFORM - ALL CODE COMBINED

**Location:** `c:\Users\Ashis\Desktop\final yearprojeact\predictive-epidemic-modeling-platform (1)\`

---

# TABLE OF CONTENTS
1. [BACKEND CODE](#backend-code)
   - [requirements.txt](#requirementstxt)
   - [main.py](#mainpy)
   - [auth_history.py](#auth_historypy)
   - [db.py](#dbpy)
   - [seir_solver.py](#seir_solverpy)
   - [network.py](#networkpy)
   - [cities.py](#citiespy)
   - [flight_routes.py](#flight_routespy)

2. [FRONTEND CODE](#frontend-code)
   - [package.json](#packagejson)
   - [vite.config.ts](#viteconfigts)
   - [tsconfig.json](#tsconfigjson)
   - [index.html](#indexhtml)
   - [main.tsx](#maintsx)
   - [App.tsx](#apptsx)
   - [AuthContext.tsx](#authcontexttsx)
   - [auth.ts](#authts)
   - [Components (Header, Login, History, etc.)](#components)
   - [cities.ts](#citiests)

3. [CONFIGURATION FILES](#configuration-files)
   - [docker-compose.yml](#docker-composeyml)
   - [Dockerfile (Backend)](#dockerfile-backend)
   - [Dockerfile (Frontend)](#dockerfile-frontend)
   - [nginx.conf](#nginxconf)

4. [RUN COMMANDS](#run-commands)

---

# BACKEND CODE

## requirements.txt
```
fastapi==0.115.0
uvicorn==0.30.6
scipy==1.14.1
numpy==1.26.4
networkx==3.3
pydantic==2.9.2
httpx2==0.24.3
python-dotenv==1.0.0
```

**Location:** `backend/requirements.txt`

---

## main.py
```python
"""FastAPI application factory and configuration."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.endpoints import router as endpoints_router
from .api.auth_history import router as auth_router
from .core.db import init_db

# Initialize database
init_db()

# Create FastAPI app
app = FastAPI(
    title="Epidemic Modeler API",
    description="SEIR epidemic simulation with multi-city network spread",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(endpoints_router)
app.include_router(auth_router)

# Health check endpoint
@app.get("/health")
async def health():
    return {"status": "healthy", "service": "epidemic-modeler-backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

**Location:** `backend/app/main.py`

---

## auth_history.py
```python
"""Authentication and history tracking endpoints."""
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uuid
import hashlib
from datetime import datetime
from ..core.db import query_one, query_all, execute

router = APIRouter(prefix="/api", tags=["auth"])

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str

class UserResponse(BaseModel):
    username: str
    email: str

class HistoryEntry(BaseModel):
    title: str
    details: str

class HistoryResponse(BaseModel):
    id: str
    username: str
    title: str
    details: str
    created_at: str

def get_username_from_token(authorization: Optional[str]) -> Optional[str]:
    """Extract and validate token from Authorization header."""
    if not authorization:
        return None
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            return None
        
        row = query_one(
            "SELECT username FROM tokens WHERE token = ?",
            (token,)
        )
        return row["username"] if row else None
    except (ValueError, KeyError, TypeError):
        return None

@router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest) -> LoginResponse:
    """Authenticate user and return token."""
    password_hash = hashlib.sha256(request.password.encode()).hexdigest()
    user = query_one(
        "SELECT * FROM users WHERE username = ? AND password_hash = ?",
        (request.username, password_hash)
    )
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create token
    token = str(uuid.uuid4())
    execute(
        "INSERT INTO tokens (token, username) VALUES (?, ?)",
        (token, request.username)
    )
    
    return LoginResponse(access_token=token, username=request.username)

@router.post("/auth/logout")
async def logout(authorization: Optional[str] = Header(None)) -> Dict[str, str]:
    """Logout user and invalidate token."""
    username = get_username_from_token(authorization)
    if not username:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        token = authorization.split()[1]
        execute("DELETE FROM tokens WHERE token = ?", (token,))
    except (IndexError, TypeError):
        pass
    
    return {"status": "logged out"}

@router.get("/auth/me", response_model=UserResponse)
async def get_me(authorization: Optional[str] = Header(None)) -> UserResponse:
    """Get current user profile."""
    username = get_username_from_token(authorization)
    if not username:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    user = query_one("SELECT * FROM users WHERE username = ?", (username,))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(username=user["username"], email=user["email"])

@router.get("/history", response_model=List[HistoryResponse])
async def get_history(authorization: Optional[str] = Header(None)) -> List[HistoryResponse]:
    """Get user's simulation history."""
    username = get_username_from_token(authorization)
    if not username:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    rows = query_all(
        "SELECT * FROM history WHERE username = ? ORDER BY created_at DESC",
        (username,)
    )
    
    return [
        HistoryResponse(
            id=row["id"],
            username=row["username"],
            title=row["title"],
            details=row["details"],
            created_at=row["created_at"]
        )
        for row in rows
    ]

@router.post("/history", response_model=HistoryResponse)
async def post_history(entry: HistoryEntry, authorization: Optional[str] = Header(None)) -> HistoryResponse:
    """Save new simulation to history."""
    username = get_username_from_token(authorization)
    if not username:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    entry_id = str(uuid.uuid4())
    created_at = datetime.utcnow().isoformat()
    
    execute(
        "INSERT INTO history (id, username, title, details, created_at) VALUES (?, ?, ?, ?, ?)",
        (entry_id, username, entry.title, entry.details, created_at)
    )
    
    return HistoryResponse(
        id=entry_id,
        username=username,
        title=entry.title,
        details=entry.details,
        created_at=created_at
    )
```

**Location:** `backend/app/api/auth_history.py`

---

## db.py
```python
"""SQLite database initialization and helpers."""
import sqlite3
import hashlib
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "data" / "app.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

def get_db_connection():
    """Get database connection with Row factory."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def query_one(sql: str, params: tuple = ()):
    """Execute query and return first row."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(sql, params)
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def query_all(sql: str, params: tuple = ()):
    """Execute query and return all rows."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(sql, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def execute(sql: str, params: tuple = ()):
    """Execute statement (INSERT, UPDATE, DELETE)."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(sql, params)
    conn.commit()
    conn.close()

def hash_password(password: str) -> str:
    """Hash password using SHA256."""
    return hashlib.sha256(password.encode()).hexdigest()

def init_db():
    """Initialize database with tables and seed admin user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            password_hash TEXT NOT NULL,
            email TEXT NOT NULL
        )
    """)
    
    # Create tokens table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tokens (
            token TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (username) REFERENCES users(username)
        )
    """)
    
    # Create history table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS history (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            title TEXT NOT NULL,
            details TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (username) REFERENCES users(username)
        )
    """)
    
    conn.commit()
    
    # Seed admin user
    admin_hash = hash_password("admin")
    try:
        cursor.execute(
            "INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)",
            ("admin", admin_hash, "admin@gridoptimizer.com")
        )
        conn.commit()
    except sqlite3.IntegrityError:
        pass  # User already exists
    
    conn.close()
```

**Location:** `backend/app/core/db.py`

---

## seir_solver.py
```python
"""SEIR differential equation solver."""
import numpy as np
from scipy.integrate import odeint
from typing import Dict, List

def seir_ode(y, t, N, beta, sigma, gamma, mu):
    """SEIR differential equations."""
    S, E, I, R = y
    dSdt = -beta * S * I / N
    dEdt = beta * S * I / N - sigma * E
    dIdt = sigma * E - gamma * I
    dRdt = gamma * I
    return [dSdt, dEdt, dIdt, dRdt]

def run_seir_simulation(
    population: int,
    initial_infected: int,
    duration_days: int,
    r0: float,
    incubation_period: float,
    recovery_period: float,
    mortality_rate: float,
    intervention_factor: float = 1.0,
) -> Dict[str, List[float]]:
    """Run SEIR simulation and return results."""
    N = population
    I0 = initial_infected
    E0 = 0
    R0 = 0
    S0 = N - I0 - E0 - R0
    
    # Parameters
    sigma = 1.0 / incubation_period
    gamma = 1.0 / recovery_period
    beta = r0 * gamma * (1.0 - intervention_factor)
    
    # Time vector
    t = np.linspace(0, duration_days, duration_days + 1)
    y0 = [S0, E0, I0, R0]
    
    # Solve ODE
    solution = odeint(seir_ode, y0, t, args=(N, beta, sigma, gamma, 0))
    
    S, E, I, R = solution.T
    D = (I * mortality_rate).astype(int)
    
    return {
        "time": t.tolist(),
        "susceptible": S.tolist(),
        "exposed": E.tolist(),
        "infected": I.tolist(),
        "recovered": R.tolist(),
        "deaths": D.tolist(),
    }
```

**Location:** `backend/app/core/seir_solver.py`

---

## network.py
```python
"""Multi-city network simulation."""
from typing import List, Dict, Any
from .seir_solver import run_seir_simulation

class NetworkSimulator:
    """Simulate epidemic spread across network of cities."""
    
    def __init__(self, cities: List[Dict], flight_routes: List[Dict], patient_zero_city: str):
        self.cities = {city["id"]: city for city in cities}
        self.flight_routes = flight_routes
        self.patient_zero_city = patient_zero_city
    
    def run_simulation(
        self,
        duration_days: int,
        r0: float,
        incubation_period: float,
        recovery_period: float,
        mortality_rate: float,
        initial_infections: float,
        isolation_index: float,
        mask_compliance: float,
        mobility_reduction: float,
        vaccination_rate: float,
        vaccine_efficacy: float,
        global_travel_enabled: bool = True,
    ) -> Dict[str, Any]:
        """Run network-wide simulation."""
        results = {}
        
        for city_id, city in self.cities.items():
            population = int(city["population"] * 1_000_000)
            
            if city_id == self.patient_zero_city:
                initial_infected = int(population * initial_infections)
            else:
                initial_infected = 0
            
            # Apply interventions
            intervention_factor = (
                (isolation_index / 100) * 0.7 +
                (mask_compliance / 100) * 0.2 +
                (mobility_reduction / 100) * 0.1
            )
            
            sim_result = run_seir_simulation(
                population=population,
                initial_infected=initial_infected,
                duration_days=duration_days,
                r0=r0 * (1 - intervention_factor),
                incubation_period=incubation_period,
                recovery_period=recovery_period,
                mortality_rate=mortality_rate / 100,
                intervention_factor=intervention_factor,
            )
            
            results[city_id] = {
                "name": city["name"],
                "country": city["country"],
                "population": population,
                "simulation": sim_result,
            }
        
        return results
```

**Location:** `backend/app/core/network.py`

---

## cities.py
```python
"""City data for epidemic modeling."""

CITIES = [
    {"id": "nyc", "name": "New York", "country": "USA", "lat": 40.7128, "lng": -74.0060, "population": 8.3, "region": "NA", "avgTemp": 10.8, "humidity": 62},
    {"id": "la", "name": "Los Angeles", "country": "USA", "lat": 34.0522, "lng": -118.2437, "population": 3.9, "region": "NA", "avgTemp": 17.5, "humidity": 67},
    {"id": "chi", "name": "Chicago", "country": "USA", "lat": 41.8781, "lng": -87.6298, "population": 2.7, "region": "NA", "avgTemp": 9.4, "humidity": 70},
    {"id": "lon", "name": "London", "country": "UK", "lat": 51.5074, "lng": -0.1278, "population": 8.9, "region": "EU", "avgTemp": 8.8, "humidity": 72},
    {"id": "par", "name": "Paris", "country": "France", "lat": 48.8566, "lng": 2.3522, "population": 2.2, "region": "EU", "avgTemp": 10.4, "humidity": 70},
    {"id": "ber", "name": "Berlin", "country": "Germany", "lat": 52.5200, "lng": 13.4050, "population": 3.6, "region": "EU", "avgTemp": 8.8, "humidity": 68},
    {"id": "mos", "name": "Moscow", "country": "Russia", "lat": 55.7558, "lng": 37.6173, "population": 12.5, "region": "EU", "avgTemp": 3.9, "humidity": 75},
    {"id": "dub", "name": "Dubai", "country": "UAE", "lat": 25.2048, "lng": 55.2708, "population": 3.3, "region": "AS", "avgTemp": 28.0, "humidity": 40},
    {"id": "tok", "name": "Tokyo", "country": "Japan", "lat": 35.6762, "lng": 139.6503, "population": 13.9, "region": "AS", "avgTemp": 15.4, "humidity": 65},
    {"id": "bei", "name": "Beijing", "country": "China", "lat": 39.9042, "lng": 116.4074, "population": 21.5, "region": "AS", "avgTemp": 11.6, "humidity": 50},
    {"id": "sin", "name": "Singapore", "country": "Singapore", "lat": 1.3521, "lng": 103.8198, "population": 5.7, "region": "AS", "avgTemp": 26.9, "humidity": 82},
    {"id": "mum", "name": "Mumbai", "country": "India", "lat": 19.0760, "lng": 72.8777, "population": 20.4, "region": "AS", "avgTemp": 27.8, "humidity": 72},
    {"id": "del", "name": "Delhi", "country": "India", "lat": 28.7041, "lng": 77.1025, "population": 30.3, "region": "AS", "avgTemp": 23.6, "humidity": 56},
    {"id": "sha", "name": "Shanghai", "country": "China", "lat": 31.2304, "lng": 121.4737, "population": 24.9, "region": "AS", "avgTemp": 15.7, "humidity": 70},
    {"id": "syd", "name": "Sydney", "country": "Australia", "lat": -33.8688, "lng": 151.2093, "population": 5.3, "region": "OC", "avgTemp": 17.8, "humidity": 66},
    {"id": "sao", "name": "São Paulo", "country": "Brazil", "lat": -23.5505, "lng": -46.6333, "population": 12.3, "region": "SA", "avgTemp": 21.8, "humidity": 74},
    {"id": "mex", "name": "Mexico City", "country": "Mexico", "lat": 19.4326, "lng": -99.1332, "population": 9.2, "region": "NA", "avgTemp": 14.8, "humidity": 60},
    {"id": "lag", "name": "Lagos", "country": "Nigeria", "lat": 6.5244, "lng": 3.3792, "population": 15.4, "region": "AF", "avgTemp": 26.5, "humidity": 78},
    {"id": "cai", "name": "Cairo", "country": "Egypt", "lat": 30.0444, "lng": 31.2357, "population": 10.1, "region": "AF", "avgTemp": 21.4, "humidity": 45},
    {"id": "bkk", "name": "Bangkok", "country": "Thailand", "lat": 13.7563, "lng": 100.5018, "population": 10.5, "region": "AS", "avgTemp": 28.9, "humidity": 71},
    {"id": "ist", "name": "Istanbul", "country": "Turkey", "lat": 41.0082, "lng": 28.9784, "population": 15.5, "region": "EU", "avgTemp": 13.5, "humidity": 67},
    {"id": "sel", "name": "Seoul", "country": "South Korea", "lat": 37.5665, "lng": 126.9780, "population": 9.7, "region": "AS", "avgTemp": 12.2, "humidity": 59},
    {"id": "tor", "name": "Toronto", "country": "Canada", "lat": 43.6532, "lng": -79.3832, "population": 2.7, "region": "NA", "avgTemp": 6.6, "humidity": 68},
    {"id": "bue", "name": "Buenos Aires", "country": "Argentina", "lat": -34.6037, "lng": -58.3816, "population": 3.1, "region": "SA", "avgTemp": 16.7, "humidity": 71},
    {"id": "jak", "name": "Jakarta", "country": "Indonesia", "lat": -6.2088, "lng": 106.8456, "population": 10.6, "region": "AS", "avgTemp": 26.7, "humidity": 79},
    {"id": "nai", "name": "Nairobi", "country": "Kenya", "lat": -1.2921, "lng": 36.8219, "population": 4.7, "region": "AF", "avgTemp": 19.0, "humidity": 58},
]
```

**Location:** `backend/app/data/cities.py`

---

## flight_routes.py
```python
"""Flight routes between cities."""

FLIGHT_ROUTES = [
    {"from": "nyc", "to": "lon", "flights_per_day": 15},
    {"from": "nyc", "to": "la", "flights_per_day": 20},
    {"from": "nyc", "to": "tor", "flights_per_day": 10},
    {"from": "la", "to": "tok", "flights_per_day": 8},
    {"from": "lon", "to": "par", "flights_per_day": 12},
    {"from": "par", "to": "ber", "flights_per_day": 8},
    {"from": "ber", "to": "mos", "flights_per_day": 6},
    {"from": "tok", "to": "bei", "flights_per_day": 10},
    {"from": "bei", "to": "sha", "flights_per_day": 25},
    {"from": "del", "to": "mum", "flights_per_day": 15},
    {"from": "del", "to": "dub", "flights_per_day": 8},
    {"from": "sin", "to": "bkk", "flights_per_day": 10},
    {"from": "bkk", "to": "del", "flights_per_day": 6},
    {"from": "syd", "to": "sin", "flights_per_day": 8},
    {"from": "sao", "to": "mex", "flights_per_day": 6},
    {"from": "lag", "to": "cai", "flights_per_day": 8},
    {"from": "ist", "to": "del", "flights_per_day": 6},
]
```

**Location:** `backend/app/data/flight_routes.py`

---

# FRONTEND CODE

## package.json
```json
{
  "name": "react-vite-tailwind",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "react": "^19.2.6",
    "react-dom": "^19.2.6",
    "react-leaflet": "^5.0.0",
    "leaflet": "^1.9.4",
    "recharts": "^3.8.1",
    "tailwindcss": "^4.1.17"
  },
  "devDependencies": {
    "@types/react": "^19.0.7",
    "@types/react-dom": "^19.0.2",
    "@types/node": "^20.10.5",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^7.3.2",
    "vite-plugin-singlefile": "^0.13.5"
  }
}
```

**Location:** `package.json`

---

## vite.config.ts
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteSingleFile from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
  },
})
```

**Location:** `vite.config.ts`

---

## tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.app.json" }]
}
```

**Location:** `tsconfig.json`

---

## index.html
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='75' font-size='75' fill='%230ea5e9'>⚕️</text></svg>" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>EpidemicModel Pro — Predictive Epidemic Modeling Platform</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Location:** `index.html`

---

## main.tsx
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

**Location:** `src/main.tsx`

---

## App.tsx
```typescript
import React, { useState } from 'react'
import { AuthProvider, AuthContext } from './context/AuthContext'
import { SimulationProvider } from './store/simulationStore'
import Header from './components/Header'
import LoginModal from './components/LoginModal'
import HistoryModal from './components/HistoryModal'
import Geomap from './components/Geomap'
import ControlPanel from './components/ControlPanel'
import ChartPanel from './components/ChartPanel'
import TimelineSlider from './components/TimelineSlider'

function AppContent() {
  const [showLogin, setShowLogin] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const authContext = React.useContext(AuthContext)
  const user = authContext?.user

  const handleOpenHistory = () => {
    if (!user) {
      setShowLogin(true)
      return
    }
    setShowHistory(true)
  }

  const handleLogout = async () => {
    if (authContext?.logout) {
      await authContext.logout()
    }
  }

  return (
    <>
      <Header
        user={user}
        onOpenLogin={() => setShowLogin(true)}
        onOpenHistory={handleOpenHistory}
        onLogout={handleLogout}
      />
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      <HistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} />
      <div className="flex h-screen bg-gradient-to-br from-sky-900 via-sky-800 to-blue-900">
        <ControlPanel />
        <Geomap />
        <ChartPanel />
      </div>
      <TimelineSlider />
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <SimulationProvider>
        <AppContent />
      </SimulationProvider>
    </AuthProvider>
  )
}
```

**Location:** `src/App.tsx`

---

## AuthContext.tsx
```typescript
import React, { createContext, useCallback, useEffect, useState } from 'react'
import * as AuthAPI from '../api/auth'

export interface HistoryEntry {
  id: string
  username: string
  title: string
  details: string
  created_at: string
}

export interface AuthContextType {
  user: any
  token: string | null
  history: HistoryEntry[]
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loadHistory: (authToken?: string) => Promise<void>
  addHistoryEntry: (title: string, details: string) => Promise<void>
}

export const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [token, setToken] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(false)

  const loadHistory = useCallback(
    async (authToken?: string) => {
      try {
        const t = authToken || token
        if (!t) return
        const data = await AuthAPI.fetchHistory(t)
        setHistory(data)
      } catch (error) {
        console.error('Failed to load history:', error)
      }
    },
    [token]
  )

  const login = useCallback(
    async (username: string, password: string) => {
      setLoading(true)
      try {
        const response = await AuthAPI.login(username, password)
        setToken(response.access_token)
        localStorage.setItem('epidemic_auth_token', response.access_token)

        const meData = await AuthAPI.me(response.access_token)
        setUser(meData)

        await loadHistory(response.access_token)
      } finally {
        setLoading(false)
      }
    },
    [loadHistory]
  )

  const logout = useCallback(async () => {
    try {
      if (token) {
        await AuthAPI.logout(token)
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setToken(null)
      setUser(null)
      setHistory([])
      localStorage.removeItem('epidemic_auth_token')
    }
  }, [token])

  const addHistoryEntry = useCallback(
    async (title: string, details: string) => {
      try {
        if (!token) return
        const entry = await AuthAPI.postHistory(token, { title, details })
        setHistory((prev) => [entry, ...prev])
      } catch (error) {
        console.error('Failed to add history entry:', error)
      }
    },
    [token]
  )

  useEffect(() => {
    const savedToken = localStorage.getItem('epidemic_auth_token')
    if (savedToken) {
      setToken(savedToken)
      AuthAPI.me(savedToken)
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('epidemic_auth_token')
        })
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, token, history, loading, login, logout, loadHistory, addHistoryEntry }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

**Location:** `src/context/AuthContext.tsx`

---

## auth.ts
```typescript
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

export interface LoginResponse {
  access_token: string
  token_type: string
  username: string
}

export interface UserResponse {
  username: string
  email: string
}

export interface HistoryEntry {
  id: string
  username: string
  title: string
  details: string
  created_at: string
}

async function handleResponse(response: Response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }
  return response.json()
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  return handleResponse(response)
}

export async function logout(token: string): Promise<void> {
  const response = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  return handleResponse(response)
}

export async function me(token: string): Promise<UserResponse> {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return handleResponse(response)
}

export async function fetchHistory(token: string): Promise<HistoryEntry[]> {
  const response = await fetch(`${API_BASE}/history`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return handleResponse(response)
}

export async function postHistory(token: string, entry: { title: string; details: string }): Promise<HistoryEntry> {
  const response = await fetch(`${API_BASE}/history`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(entry),
  })
  return handleResponse(response)
}
```

**Location:** `src/api/auth.ts`

---

## COMPONENTS

### Header.tsx
```typescript
import React from 'react'

export default function Header({ user, onOpenLogin, onOpenHistory, onLogout }: any) {
  return (
    <header className="bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚕️</span>
          <div>
            <h1 className="text-2xl font-bold">EpidemicModel Pro</h1>
            <p className="text-sm text-gray-400">Predictive Epidemic Modeling Platform</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <button onClick={onOpenHistory} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium">
                History
              </button>
              <button onClick={onLogout} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-medium">
                Sign Out
              </button>
              <span className="text-gray-300 font-medium">{user.username}</span>
            </>
          ) : (
            <button onClick={onOpenLogin} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-medium">
              Operator Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
```

**Location:** `src/components/Header.tsx`

---

### LoginModal.tsx
```typescript
import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function LoginModal({ isOpen, onClose }: any) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin')
  const [error, setError] = useState('')
  const { login, loading } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(username, password)
      onClose()
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl">
        <h2 className="text-2xl font-bold mb-6">Operator Sign In</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <button onClick={onClose} className="mt-4 w-full text-gray-500 hover:text-gray-700">
          Close
        </button>
      </div>
    </div>
  )
}
```

**Location:** `src/components/LoginModal.tsx`

---

### HistoryModal.tsx
```typescript
import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function HistoryModal({ isOpen, onClose }: any) {
  const { history, addHistoryEntry } = useAuth()
  const [title, setTitle] = useState('')
  const [details, setDetails] = useState('')

  const handleAdd = async () => {
    if (title && details) {
      await addHistoryEntry(title, details)
      setTitle('')
      setDetails('')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto shadow-2xl">
        <h2 className="text-2xl font-bold mb-4">Simulation History</h2>
        <div className="space-y-3 mb-6 max-h-40 overflow-y-auto">
          {history.map((entry) => (
            <div key={entry.id} className="border rounded p-3 bg-gray-50">
              <p className="font-semibold">{entry.title}</p>
              <p className="text-sm text-gray-600">{entry.details}</p>
              <p className="text-xs text-gray-400 mt-1">{new Date(entry.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
        <div className="border-t pt-4">
          <input
            type="text"
            placeholder="Simulation Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded mb-2"
          />
          <textarea
            placeholder="Simulation Details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="w-full px-3 py-2 border rounded mb-2"
            rows={3}
          />
          <button
            onClick={handleAdd}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 mb-2"
          >
            Add Entry
          </button>
        </div>
        <button onClick={onClose} className="w-full text-gray-500 hover:text-gray-700">
          Close
        </button>
      </div>
    </div>
  )
}
```

**Location:** `src/components/HistoryModal.tsx`

---

### ControlPanel.tsx
```typescript
import React, { useContext } from 'react'
import { SimulationStore } from '../store/simulationStore'
import { cities } from '../data/cities'

export default function ControlPanel() {
  const { state, updateSimulation } = useContext(SimulationStore) as any

  const handleParameterChange = (key: string, value: any) => {
    updateSimulation({ ...state, [key]: value })
  }

  return (
    <aside className="w-80 bg-slate-900 bg-opacity-90 text-white p-6 overflow-y-auto flex-shrink-0">
      <h2 className="text-xl font-bold mb-6">Simulation Controls</h2>

      <div className="space-y-6">
        {/* Patient Zero */}
        <div>
          <label className="block text-sm font-medium mb-2">Patient Zero Location</label>
          <select
            value={state.patientZeroCity || 'bei'}
            onChange={(e) => handleParameterChange('patientZeroCity', e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
          >
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}, {city.country} ({city.population})
              </option>
            ))}
          </select>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium mb-2">Simulation Duration (days)</label>
          <select
            value={state.durationDays || 180}
            onChange={(e) => handleParameterChange('durationDays', parseInt(e.target.value))}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
          >
            <option value="60">60 Days (2 months)</option>
            <option value="120">120 Days (4 months)</option>
            <option value="180">180 Days (6 months)</option>
            <option value="365">365 Days (1 year)</option>
          </select>
        </div>

        {/* Pathogen Properties */}
        <div className="border-t border-slate-700 pt-4">
          <h3 className="text-lg font-semibold mb-3">Pathogen Properties</h3>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">R₀ (Reproduction Number): {state.r0 || 2.5}</label>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.1"
              value={state.r0 || 2.5}
              onChange={(e) => handleParameterChange('r0', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Incubation Period (days): {state.incubationPeriod || 5}</label>
            <input
              type="range"
              min="1"
              max="14"
              step="0.1"
              value={state.incubationPeriod || 5}
              onChange={(e) => handleParameterChange('incubationPeriod', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Recovery Period (days): {state.recoveryPeriod || 10}</label>
            <input
              type="range"
              min="1"
              max="21"
              step="0.1"
              value={state.recoveryPeriod || 10}
              onChange={(e) => handleParameterChange('recoveryPeriod', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Mortality Rate (%): {state.mortalityRate || 0.5}</label>
            <input
              type="range"
              min="0"
              max="5"
              step="0.1"
              value={state.mortalityRate || 0.5}
              onChange={(e) => handleParameterChange('mortalityRate', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* Interventions */}
        <div className="border-t border-slate-700 pt-4">
          <h3 className="text-lg font-semibold mb-3">Interventions</h3>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Global Isolation Index: {state.isolationIndex || 0}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={state.isolationIndex || 0}
              onChange={(e) => handleParameterChange('isolationIndex', parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Mask Mandate Compliance (%): {state.maskCompliance || 0}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={state.maskCompliance || 0}
              onChange={(e) => handleParameterChange('maskCompliance', parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Vaccination Rate (%): {state.vaccinationRate || 0}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={state.vaccinationRate || 0}
              onChange={(e) => handleParameterChange('vaccinationRate', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </aside>
  )
}
```

**Location:** `src/components/ControlPanel.tsx`

---

### Geomap.tsx
```typescript
import React, { useContext } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { SimulationStore } from '../store/simulationStore'
import { cities } from '../data/cities'

export default function Geomap() {
  const { state } = useContext(SimulationStore) as any

  return (
    <div className="flex-1 relative">
      <MapContainer center={[20, 0]} zoom={2} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {cities.map((city) => {
          const infectionRate = state.simulationResults?.[city.id]?.infectionRate || 0
          const color = infectionRate > 50 ? 'red' : infectionRate > 20 ? 'orange' : 'yellow'
          const radius = 15 + infectionRate / 10

          return (
            <CircleMarker
              key={city.id}
              center={[city.lat, city.lng]}
              radius={radius}
              fillColor={color}
              color="#333"
              weight={2}
              opacity={0.8}
              fillOpacity={0.7}
            >
              <Popup>
                <div>
                  <strong>{city.name}, {city.country}</strong>
                  <br />
                  Population: {city.population}M
                  <br />
                  Infection Rate: {infectionRate.toFixed(1)}%
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>
    </div>
  )
}
```

**Location:** `src/components/Geomap.tsx`

---

### ChartPanel.tsx
```typescript
import React, { useContext } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { SimulationStore } from '../store/simulationStore'

export default function ChartPanel() {
  const { state } = useContext(SimulationStore) as any

  const chartData = state.chartData || []

  return (
    <div className="w-96 bg-slate-900 bg-opacity-90 text-white p-6 overflow-y-auto flex-shrink-0">
      <h2 className="text-xl font-bold mb-4">SEIR Dynamics</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="susceptible" stroke="#3b82f6" />
          <Line type="monotone" dataKey="exposed" stroke="#f59e0b" />
          <Line type="monotone" dataKey="infected" stroke="#ef4444" />
          <Line type="monotone" dataKey="recovered" stroke="#10b981" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

**Location:** `src/components/ChartPanel.tsx`

---

### TimelineSlider.tsx
```typescript
import React, { useContext } from 'react'
import { SimulationStore } from '../store/simulationStore'

export default function TimelineSlider() {
  const { state, updateSimulation } = useContext(SimulationStore) as any

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 bg-opacity-90 text-white p-4 border-t border-slate-700">
      <div className="max-w-6xl mx-auto flex items-center gap-4">
        <span className="font-medium">Day: {state.currentDay || 0}</span>
        <input
          type="range"
          min="0"
          max={state.durationDays || 180}
          value={state.currentDay || 0}
          onChange={(e) => updateSimulation({ ...state, currentDay: parseInt(e.target.value) })}
          className="flex-1"
        />
        <span className="text-sm text-gray-400">{state.durationDays || 180} days</span>
      </div>
    </div>
  )
}
```

**Location:** `src/components/TimelineSlider.tsx`

---

## cities.ts
```typescript
export const cities = [
  { id: 'nyc', name: 'New York', country: 'USA', lat: 40.7128, lng: -74.0060, population: '8.3M' },
  { id: 'la', name: 'Los Angeles', country: 'USA', lat: 34.0522, lng: -118.2437, population: '3.9M' },
  { id: 'chi', name: 'Chicago', country: 'USA', lat: 41.8781, lng: -87.6298, population: '2.7M' },
  { id: 'lon', name: 'London', country: 'UK', lat: 51.5074, lng: -0.1278, population: '8.9M' },
  { id: 'par', name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522, population: '2.2M' },
  { id: 'ber', name: 'Berlin', country: 'Germany', lat: 52.5200, lng: 13.4050, population: '3.6M' },
  { id: 'mos', name: 'Moscow', country: 'Russia', lat: 55.7558, lng: 37.6173, population: '12.5M' },
  { id: 'dub', name: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708, population: '3.3M' },
  { id: 'tok', name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503, population: '13.9M' },
  { id: 'bei', name: 'Beijing', country: 'China', lat: 39.9042, lng: 116.4074, population: '21.5M' },
  { id: 'sin', name: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198, population: '5.7M' },
  { id: 'mum', name: 'Mumbai', country: 'India', lat: 19.0760, lng: 72.8777, population: '20.4M' },
  { id: 'del', name: 'Delhi', country: 'India', lat: 28.7041, lng: 77.1025, population: '30.3M' },
  { id: 'sha', name: 'Shanghai', country: 'China', lat: 31.2304, lng: 121.4737, population: '24.9M' },
  { id: 'syd', name: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093, population: '5.3M' },
  { id: 'sao', name: 'São Paulo', country: 'Brazil', lat: -23.5505, lng: -46.6333, population: '12.3M' },
  { id: 'mex', name: 'Mexico City', country: 'Mexico', lat: 19.4326, lng: -99.1332, population: '9.2M' },
  { id: 'lag', name: 'Lagos', country: 'Nigeria', lat: 6.5244, lng: 3.3792, population: '15.4M' },
  { id: 'cai', name: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357, population: '10.1M' },
  { id: 'bkk', name: 'Bangkok', country: 'Thailand', lat: 13.7563, lng: 100.5018, population: '10.5M' },
  { id: 'ist', name: 'Istanbul', country: 'Turkey', lat: 41.0082, lng: 28.9784, population: '15.5M' },
  { id: 'sel', name: 'Seoul', country: 'South Korea', lat: 37.5665, lng: 126.9780, population: '9.7M' },
  { id: 'tor', name: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832, population: '2.7M' },
  { id: 'bue', name: 'Buenos Aires', country: 'Argentina', lat: -34.6037, lng: -58.3816, population: '3.1M' },
  { id: 'jak', name: 'Jakarta', country: 'Indonesia', lat: -6.2088, lng: 106.8456, population: '10.6M' },
  { id: 'nai', name: 'Nairobi', country: 'Kenya', lat: -1.2921, lng: 36.8219, population: '4.7M' },
]
```

**Location:** `src/data/cities.ts`

---

# CONFIGURATION FILES

## docker-compose.yml
```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    ports:
      - "8000:8000"
    environment:
      - PYTHONUNBUFFERED=1
    volumes:
      - ./backend:/app/backend

  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  db:
```

**Location:** `docker-compose.yml`

---

## Dockerfile (Backend)
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/

CMD ["python", "-m", "uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Location:** `backend/Dockerfile`

---

## Dockerfile (Frontend)
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**Location:** `frontend/Dockerfile`

---

## nginx.conf
```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Location:** `frontend/nginx.conf`

---

# RUN COMMANDS

## Quick Start (Local Development)

### Terminal 1 - Backend Server:
```powershell
cd "c:\Users\Ashis\Desktop\final yearprojeact\predictive-epidemic-modeling-platform (1)"
pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```

### Terminal 2 - Frontend Server:
```powershell
cd "c:\Users\Ashis\Desktop\final yearprojeact\predictive-epidemic-modeling-platform (1)"
npm install
npm run build
npm run preview -- --host 0.0.0.0 --port 3000
```

### Access:
- Dashboard: http://localhost:3000/
- API Docs: http://localhost:8000/docs
- Login: `admin` / `admin`

---

## Docker Deployment:
```bash
docker-compose up -d
# Backend: http://localhost:8000
# Frontend: http://localhost
```

---
