// Extended types for the context

import { SimulationParams, SimulationResult } from './index';

export interface SimulationContextType {
  state: {
    params: SimulationParams;
    result: SimulationResult | null;
    currentDay: number;
    isRunning: boolean;
    isPlaying: boolean;
    playSpeed: number;
    error: string | null;
    isDayMode: boolean;
  };
  dispatch: (action: { type: string; payload?: unknown }) => void;
  runSimulation: () => void;
}
