/**
 * App.tsx — Main application layout
 * 
 * Predictive Epidemic Modeling Platform
 * Extended SEIR differential equations solver with spatial spread simulation.
 */

import { useEffect, useState } from 'react';
import { SimulationProvider, useSimulation } from './store/simulationStore';
import { Header } from './components/Header';
import { Geomap } from './components/Geomap';
import { ControlPanel } from './components/ControlPanel';
import { ChartPanel } from './components/ChartPanel';
import { TimelineSlider } from './components/TimelineSlider';
import { PatientZeroSelector } from './components/PatientZeroSelector';
import { LoginModal } from './components/LoginModal';
import { HistoryModal } from './components/HistoryModal';
import { AuthProvider, useAuth } from './context/AuthContext';

function AppContent() {
  const { state, dispatch, runSimulation } = useSimulation();
  const { user, history, historyLoading, loadHistory, addHistoryEntry, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Run initial simulation on mount
  useEffect(() => {
    runSimulation();
  }, [runSimulation]);

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white overflow-hidden">
      <Header
        onOpenLogin={() => setShowLogin(true)}
        onOpenHistory={() => {
          if (!user) {
            setShowLogin(true);
            return;
          }
          setShowHistory(true);
        }}
        onLogout={() => {
          setShowHistory(false);
          setShowLogin(false);
          void logout();
        }}
        user={user}
      />

      {/* Main content: sidebar + map/charts */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Control Panel */}
        <aside className="w-72 flex-shrink-0 bg-slate-900/50 border-r border-slate-700/50 overflow-y-auto">
          <div className="p-4 space-y-4">
            <PatientZeroSelector />

            {/* Simulation Days */}
            <div>
              <label className="text-xs text-slate-300 block mb-1.5">Simulation Duration (days)</label>
              <select
                value={state.params.simulationDays}
                onChange={(e) => dispatch({ type: 'SET_PARAMS', payload: { simulationDays: Number(e.target.value) } })}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white
                  focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              >
                <option value={60}>60 Days (2 months)</option>
                <option value={120}>120 Days (4 months)</option>
                <option value={180}>180 Days (6 months)</option>
                <option value={365}>365 Days (1 year)</option>
              </select>
            </div>

            <ControlPanel />
          </div>
        </aside>

        {/* Center: Map + Charts */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Map area */}
          <div className="flex-1 p-3 min-h-0">
            <Geomap />
          </div>

          {/* Charts area */}
          <div className="h-[380px] flex-shrink-0 p-3 pt-0">
            <div className="h-full bg-slate-900/30 rounded-xl border border-slate-700/50 p-2">
              <ChartPanel />
            </div>
          </div>
        </main>
      </div>

      {/* Bottom: Timeline Slider */}
      <TimelineSlider />

      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
      <HistoryModal
        open={showHistory}
        onClose={() => setShowHistory(false)}
        history={history}
        loading={historyLoading}
        onRefresh={loadHistory}
        onAdd={addHistoryEntry}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SimulationProvider>
        <AppContent />
      </SimulationProvider>
    </AuthProvider>
  );
}
