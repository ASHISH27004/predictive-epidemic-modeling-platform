/**
 * Simulation Store — Central state management for the epidemic model
 * Uses React Context + useReducer pattern for state management.
 */

import { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { SimulationParams, SimulationResult } from '../types';
import type { SimulationContextType } from '../types/context';
import { runMultiNodeSimulation } from '../engine/network';

// Default simulation parameters
const defaultParams: SimulationParams = {
  beta: 0.3,
  sigma: 1 / 5.2, // 5.2 day incubation period
  gamma: 1 / 10,  // 10 day recovery period
  mu: 0.005,      // 0.5% mortality rate
  r0: 2.5,
  isolationIndex: 0,
  maskCompliance: 0,
  vaccineRate: 0,
  vaccineEfficacy: 85,
  borderRestrictions: false,
  flightBan: false,
  patientZeroId: 'pek',
  initialInfections: 0.001, // 1000 people
  simulationDays: 180,
  mobilityReduction: 0,
};

interface SimulationState {
  params: SimulationParams;
  result: SimulationResult | null;
  currentDay: number;
  isRunning: boolean;
  isPlaying: boolean;
  playSpeed: number;
  error: string | null;
  isDayMode: boolean;
}

const initialState: SimulationState = {
  params: defaultParams,
  result: null,
  currentDay: 0,
  isRunning: false,
  isPlaying: false,
  playSpeed: 1,
  error: null,
  isDayMode: true,
};

type Action =
  | { type: 'SET_PARAMS'; payload: Partial<SimulationParams> }
  | { type: 'SET_CURRENT_DAY'; payload: number }
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SET_PLAY_SPEED'; payload: number }
  | { type: 'SET_DAY_MODE'; payload: boolean }
  | { type: 'RUN_SIMULATION' }
  | { type: 'SIMULATION_COMPLETE'; payload: SimulationResult }
  | { type: 'SIMULATION_ERROR'; payload: string }
  | { type: 'TICK' };

function reducer(state: SimulationState, action: Action): SimulationState {
  switch (action.type) {
    case 'SET_PARAMS':
      return { ...state, params: { ...state.params, ...action.payload } };
    case 'SET_CURRENT_DAY':
      return { ...state, currentDay: Math.max(0, Math.min(action.payload, state.params.simulationDays)) };
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.payload };
    case 'SET_PLAY_SPEED':
      return { ...state, playSpeed: action.payload };
    case 'RUN_SIMULATION':
      return { ...state, isRunning: true, currentDay: 0, isPlaying: false, error: null };
    case 'SIMULATION_COMPLETE':
      return { ...state, result: action.payload, isRunning: false, currentDay: 0 };
    case 'SIMULATION_ERROR':
      return { ...state, error: action.payload, isRunning: false };
    case 'SET_DAY_MODE':
      return { ...state, isDayMode: action.payload };
    case 'TICK':
      if (!state.isPlaying || !state.result) return state;
      return {
        ...state,
        currentDay: state.currentDay >= state.params.simulationDays
          ? state.params.simulationDays
          : state.currentDay + state.playSpeed,
        isPlaying: state.currentDay + state.playSpeed >= state.params.simulationDays ? false : state.isPlaying,
      };
    default:
      return state;
  }
}

const SimulationContext = createContext<SimulationContextType | null>(null);

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const playRef = useRef<number | null>(null);

  // Play/pause tick
  useEffect(() => {
    if (state.isPlaying) {
      playRef.current = window.setInterval(() => {
        dispatch({ type: 'TICK' });
      }, 200);
    } else if (playRef.current) {
      clearInterval(playRef.current);
      playRef.current = null;
    }
    return () => {
      if (playRef.current) clearInterval(playRef.current);
    };
  }, [state.isPlaying]);

  const runSimulation = useCallback(() => {
    dispatch({ type: 'RUN_SIMULATION' });

    // Run async to avoid blocking the UI render cycle
    Promise.resolve().then(() => {
      try {
        const result = runMultiNodeSimulation(state.params);
        dispatch({ type: 'SIMULATION_COMPLETE', payload: result });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown simulation error';
        dispatch({ type: 'SIMULATION_ERROR', payload: msg });
      }
    });
  }, [state.params]);

  const value: SimulationContextType = {
    state,
    dispatch: dispatch as SimulationContextType['dispatch'],
    runSimulation,
  };

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within SimulationProvider');
  }
  return context;
}
