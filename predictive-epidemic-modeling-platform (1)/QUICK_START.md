# 🚀 QUICK START GUIDE - Run Everything in 3 Steps

## Your Project Location:
```
c:\Users\Ashis\Desktop\final yearprojeact\predictive-epidemic-modeling-platform (1)\
```

---

## Step 1️⃣: Open TWO PowerShell Windows

### **Window 1 - Backend Server**
```powershell
cd "c:\Users\Ashis\Desktop\final yearprojeact\predictive-epidemic-modeling-platform (1)"
pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```

Wait for: `Uvicorn running on http://0.0.0.0:8000`

---

### **Window 2 - Frontend Server** (Open new PowerShell)
```powershell
cd "c:\Users\Ashis\Desktop\final yearprojeact\predictive-epidemic-modeling-platform (1)"
npm install
npm run build
npm run preview -- --host 0.0.0.0 --port 3000
```

Wait for: `Local: http://localhost:3000/`

---

## Step 2️⃣: Open Dashboard
Click or paste in browser:
### 👉 **http://localhost:3000/**

---

## Step 3️⃣: Login & Use
- **Username:** `admin`
- **Password:** `admin`
- Click **"Operator Sign In"** button
- Dashboard loads with 26 cities including **Delhi**

---

## Available Features

### 🗺️ Interactive Map
- Shows infection spread across 26 cities
- Color intensity = infection rate

### 📊 Real-Time Charts
- SEIR compartments (Susceptible, Exposed, Infectious, Recovered)
- Daily new infections over time

### 🎛️ Control Panel (Left Sidebar)
- Patient Zero Location selector
- Simulation duration (60-365 days)
- **Pathogen Properties:**
  - R₀ (Reproduction Number)
  - Incubation period
  - Recovery period
  - Mortality rate
  - Initial infections
- **Interventions:**
  - Isolation index
  - Mask compliance
  - Mobility reduction
  - Vaccination rate & efficacy
  - Global travel restrictions

### ⏱️ Timeline Slider
- Scrub through day-by-day results
- Watch epidemic progression

### 📝 History
- Sign in with `admin/admin`
- Click **History** button
- Save simulation runs with title & details
- View past results

### 🌙 Theme Toggle
- Day/Night mode button in header

---

## API Endpoints (Developers)

All endpoints available at: **http://localhost:8000/docs**

### Simulation
```bash
POST /api/simulate
GET /api/graph
GET /api/cities
GET /api/routes
```

### Authentication
```bash
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me
```

### History
```bash
GET /api/history
POST /api/history
```

---

## Troubleshooting

### Backend won't start?
```powershell
# Make sure you're in the right directory
cd "c:\Users\Ashis\Desktop\final yearprojeact\predictive-epidemic-modeling-platform (1)"

# Clean install dependencies
rm -r backend/__pycache__
pip install --upgrade pip
pip install -r backend/requirements.txt
```

### Frontend won't start?
```powershell
# Make sure you're in the right directory
cd "c:\Users\Ashis\Desktop\final yearprojeact\predictive-epidemic-modeling-platform (1)"

# Clean npm cache
npm cache clean --force
rm -r node_modules package-lock.json
npm install
npm run build
npm run preview -- --host 0.0.0.0 --port 3000
```

### Port already in use?
```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill the process (replace PID)
taskkill /PID <PID> /F

# Find process using port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Can't login?
- Make sure backend is running (check http://localhost:8000/health)
- Default credentials: `admin` / `admin`
- Check browser console for errors (F12)

---

## File Structure

```
📦 predictive-epidemic-modeling-platform (1)/
├── 📂 backend/
│   ├── app/
│   │   ├── main.py ......................... FastAPI app
│   │   ├── api/
│   │   │   ├── endpoints.py ............... Simulation API
│   │   │   └── auth_history.py ........... Auth & history
│   │   └── core/
│   │       ├── db.py ..................... SQLite database
│   │       ├── seir_solver.py ........... Differential equations
│   │       └── network.py ............... Multi-city simulation
│   └── requirements.txt ................... Python dependencies
│
├── 📂 frontend/ ............................ Nginx config
│
├── 📂 src/ ................................ React source
│   ├── App.tsx ........................... Main component
│   ├── main.tsx .......................... Entry point
│   ├── index.css ......................... Tailwind styles
│   ├── context/
│   │   └── AuthContext.tsx .............. Auth state
│   ├── api/
│   │   └── auth.ts ...................... HTTP client
│   ├── components/
│   │   ├── Header.tsx ................... Nav bar
│   │   ├── LoginModal.tsx ............... Login form
│   │   ├── HistoryModal.tsx ............. History records
│   │   ├── ControlPanel.tsx ............. Parameters
│   │   ├── Geomap.tsx ................... Leaflet map
│   │   ├── ChartPanel.tsx ............... Recharts
│   │   └── TimelineSlider.tsx ........... Day scrubber
│   ├── data/
│   │   ├── cities.ts .................... 26 cities (Delhi added)
│   │   └── flightNetwork.ts ............. Routes
│   └── types/
│       └── index.ts ..................... TypeScript types
│
├── package.json .......................... NPM dependencies
├── vite.config.ts ........................ Build config
├── tsconfig.json ......................... TypeScript config
├── index.html ............................ HTML entry
├── docker-compose.yml .................... Docker config
└── README.md ............................ Project docs
```

---

## Technology Stack

### Backend
- **Framework:** FastAPI (Python)
- **Server:** Uvicorn
- **Database:** SQLite
- **Simulation:** SciPy (ODE solver), NumPy
- **Network:** NetworkX

### Frontend
- **Framework:** React 19 + TypeScript
- **Build:** Vite 7
- **Styling:** Tailwind CSS 4
- **Charts:** Recharts
- **Maps:** React-Leaflet + Leaflet
- **State:** React Context API

---

## What's New in This Build

✅ **Delhi City Added** - 30.3M population, strategic Asian location  
✅ **Authentication Integrated** - Login/logout with SQLite persistence  
✅ **History Tracking** - Save and retrieve simulation runs  
✅ **Multi-city Simulation** - 26 cities with network spread  
✅ **Interactive Dashboard** - Full parameter control  
✅ **Production Build** - Optimized single-file HTML bundle  

---

## Performance

- **Frontend Build:** 5.96 seconds
- **Bundle Size:** 828 KB (243 KB gzipped)
- **Simulation (180 days, 26 cities):** <2 seconds
- **Database Queries:** <10ms

---

## Next Steps (Optional)

1. **Export Data:** Add CSV export for simulation results
2. **WebSocket Updates:** Real-time simulation progress
3. **Multi-user:** Role-based access control
4. **Email Alerts:** Notifications on epidemic milestones
5. **Data Import:** Load real epidemiological data

---

## Support Resources

- **Backend Docs:** http://localhost:8000/docs (when running)
- **Type Definitions:** See `src/types/index.ts`
- **Database:** `backend/app/data/app.db` (SQLite)
- **Tests:** `python backend/tests/test_seir.py`

---

## Deployment Options

### Docker
```bash
docker-compose up -d
```

### Cloud (AWS/Azure/GCP)
```bash
# Backend
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000

# Frontend (after build)
npm run preview -- --host 0.0.0.0 --port 3000
```

### Traditional Server
```bash
# Install systemd service or use supervisor
# Keep both backend and frontend running
```

---

**Project Status: ✅ READY TO RUN**

🎯 Follow the 3 steps above to launch the complete platform!
