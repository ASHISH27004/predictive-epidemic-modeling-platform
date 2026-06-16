// Type definitions for the EpidemicModel Platform

export interface SEIRState {
  S: number; // Susceptible (millions)
  E: number; // Exposed (millions)
  I: number; // Infectious (millions)
  R: number; // Recovered (millions)
  D: number; // Deceased (millions)
}

export interface CityState {
  cityId: string;
  cityName: string;
  seir: SEIRState;
  population: number;
  infectionRate: number; // I / population
  prevalence: number; // (I + E) / population
  cumulativeDeaths: number;
}

export interface SimulationParams {
  beta: number;        // Base transmission rate
  sigma: number;       // Incubation rate (1/incubation_period)
  gamma: number;       // Recovery rate (1/recovery_period)
  mu: number;          // Mortality rate
  r0: number;          // Basic reproduction number
  isolationIndex: number; // 0-1, global isolation level
  maskCompliance: number; // 0-100, percent
  vaccineRate: number; // 0-100, percent per day (of remaining susceptible)
  vaccineEfficacy: number; // 0-100, percent
  borderRestrictions: boolean;
  flightBan: boolean;
  patientZeroId: string;
  initialInfections: number; // initial infected count
  simulationDays: number;
  mobilityReduction: number; // 0-1, reduction in mobility
}

export interface SimulationResult {
  days: number[];
  cityData: Record<number, CityState[]>; // day -> array of city states
  globalSummary: Record<number, SEIRState>; // day -> global totals
  verification: {
    populationConserved: boolean;
    maxDrift: number;
    maxDriftDay: number;
  };
}

export interface MapMarkerData {
  lat: number;
  lng: number;
  cityId: string;
  cityName: string;
  infectionRate: number;
  seir: SEIRState;
  population: number;
  cumulativeDeaths: number;
}

export interface RouteData {
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
  intensity: number; // based on current infection levels at endpoints
  weeklyPax: number;
}

export interface AuthUser {
  username: string;
  email?: string;
}

export interface HistoryEntry {
  id: string;
  user: string;
  title: string;
  details: string;
  created_at?: string;
}

// Re-export context types
export type { SimulationContextType } from './context';
