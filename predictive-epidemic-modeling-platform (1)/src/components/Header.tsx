/**
 * Header — Top navigation bar with platform branding and simulation status.
 */

import { useSimulation } from '../store/simulationStore';
import { cities } from '../data/cities';
import type { AuthUser } from '../types';

interface HeaderProps {
  user: AuthUser | null;
  onOpenLogin: () => void;
  onOpenHistory: () => void;
  onLogout: () => void;
}

export function Header({ user, onOpenLogin, onOpenHistory, onLogout }: HeaderProps) {
  const { state, dispatch } = useSimulation();

  const patientZero = cities.find((c) => c.id === state.params.patientZeroId);

  return (
    <header className="flex items-center justify-between px-5 py-2.5 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="relative w-8 h-8">
          <svg viewBox="0 0 32 32" className="w-8 h-8">
            <circle cx="16" cy="16" r="14" fill="none" stroke="#14b8a6" strokeWidth="1.5" strokeDasharray="4 2" />
            <circle cx="16" cy="16" r="8" fill="none" stroke="#06b6d4" strokeWidth="1" strokeDasharray="2 2" />
            <circle cx="16" cy="16" r="3" fill="#14b8a6" opacity="0.8" />
            <line x1="16" y1="2" x2="16" y2="8" stroke="#14b8a6" strokeWidth="1" opacity="0.5" />
            <line x1="16" y1="24" x2="16" y2="30" stroke="#14b8a6" strokeWidth="1" opacity="0.5" />
            <line x1="2" y1="16" x2="8" y2="16" stroke="#14b8a6" strokeWidth="1" opacity="0.5" />
            <line x1="24" y1="16" x2="30" y2="16" stroke="#14b8a6" strokeWidth="1" opacity="0.5" />
          </svg>
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-white">
            EpidemicModel <span className="text-teal-400">Pro</span>
          </h1>
          <p className="text-[10px] text-slate-500 tracking-wide">Predictive Epidemic Modeling Platform</p>
        </div>
      </div>

      {/* Center: Scenario Info */}
      <div className="flex items-center gap-6 text-xs">
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${state.isRunning ? 'bg-amber-400 animate-pulse' : state.result ? 'bg-emerald-400' : 'bg-slate-600'}`} />
          <span className="text-slate-400">
            {state.isRunning ? 'Computing...' : state.result ? 'Ready' : 'Idle'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>Patient Zero: {patientZero?.name}, {patientZero?.country}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
          </svg>
          <span>{cities.length} Cities · {state.params.simulationDays} Days</span>
        </div>
      </div>

      {/* Right: Status indicators */}
      <div className="flex items-center gap-3">
        {/* Day/Night Toggle */}
        <button
          onClick={() => dispatch({ type: 'SET_DAY_MODE', payload: !state.isDayMode })}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all duration-300 ${
            state.isDayMode
              ? 'bg-amber-100 border-amber-300 text-amber-700 hover:bg-amber-200'
              : 'bg-indigo-900/50 border-indigo-500/30 text-indigo-300 hover:bg-indigo-800/50'
          }`}
          title={state.isDayMode ? 'Switch to Night Mode' : 'Switch to Day Mode'}
        >
          {state.isDayMode ? (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
          <span className="text-[10px] font-semibold uppercase tracking-wide">{state.isDayMode ? 'Day' : 'Night'}</span>
        </button>

        {state.params.borderRestrictions && (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 rounded border border-amber-500/30">
            Borders Closed
          </span>
        )}
        {state.params.flightBan && (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 rounded border border-red-500/30">
            Flight Ban
          </span>
        )}
        {state.params.maskCompliance > 0 && (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-400 rounded border border-teal-500/30">
            Masks {state.params.maskCompliance}%
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {user && (
          <button
            onClick={onOpenHistory}
            className="rounded-full border border-slate-700/70 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-teal-400 hover:text-teal-300"
          >
            History
          </button>
        )}
        {user ? (
          <>
            <button
              onClick={onLogout}
              className="rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/25"
            >
              Sign Out
            </button>
            <span className="rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-2 text-xs text-teal-200">
              {user.username}
            </span>
          </>
        ) : (
          <button
            onClick={onOpenLogin}
            className="rounded-full border border-teal-500/40 bg-teal-500/15 px-3 py-2 text-xs font-semibold text-teal-200 transition hover:bg-teal-500/25"
          >
            Operator Sign In
          </button>
        )}
      </div>
    </header>
  );
}
