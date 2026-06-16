/**
 * SEIR Differential Equations Solver
 * 
 * Extended SEIR model with mortality and vaccination:
 *   dS/dt = -β*S*I/N - vaccine_rate*S
 *   dE/dt = β*S*I/N - σ*E
 *   dI/dt = σ*E - γ*I - μ*I
 *   dR/dt = γ*I + vaccine_rate*S*(1 - vaccine_efficacy)
 *   dD/dt = μ*I
 *
 * β is modulated by temperature, humidity, mask compliance, and isolation index.
 * Uses 4th-order Runge-Kutta (RK4) integration for numerical accuracy.
 */

import { SEIRState, SimulationParams } from '../types';

// RK4 integration step for SEIR equations
function rk4Step(
  state: SEIRState,
  dt: number,
  params: SimulationParams,
  N: number,
  currentBeta: number,
  mobilityIn: number,
  mobilityOut: number
): SEIRState {
  const { sigma, gamma, mu, vaccineRate, vaccineEfficacy } = params;
  const vRate = (vaccineRate / 100) * 0.01; // convert percent to daily rate

  const deriv = (s: SEIRState): SEIRState => {
    const totalPop = N;
    const effectiveBeta = currentBeta;
    const contactTerm = (effectiveBeta * s.S * s.I) / totalPop;
    const vaccinationTerm = vRate * s.S;
    const ve = vaccineEfficacy / 100;

    return {
      S: -contactTerm - vaccinationTerm - mobilityOut + mobilityIn,
      E: contactTerm - sigma * s.E,
      I: sigma * s.E - gamma * s.I - mu * s.I,
      R: gamma * s.I + vaccinationTerm * (1 - ve),
      D: mu * s.I,
    };
  };

  const addState = (a: SEIRState, b: SEIRState, factor: number): SEIRState => ({
    S: a.S + b.S * factor,
    E: a.E + b.E * factor,
    I: a.I + b.I * factor,
    R: a.R + b.R * factor,
    D: a.D + b.D * factor,
  });

  const k1 = deriv(state);
  const s2 = addState(state, k1, dt / 2);
  // Clamp negatives for deriv evaluation
  const s2Clamped = clampState(s2);
  const k2 = deriv(s2Clamped);
  const s3 = addState(state, k2, dt / 2);
  const s3Clamped = clampState(s3);
  const k3 = deriv(s3Clamped);
  const s4 = addState(state, k3, dt);
  const s4Clamped = clampState(s4);
  const k4 = deriv(s4Clamped);

  return {
    S: state.S + (dt / 6) * (k1.S + 2 * k2.S + 2 * k3.S + k4.S),
    E: state.E + (dt / 6) * (k1.E + 2 * k2.E + 2 * k3.E + k4.E),
    I: state.I + (dt / 6) * (k1.I + 2 * k2.I + 2 * k3.I + k4.I),
    R: state.R + (dt / 6) * (k1.R + 2 * k2.R + 2 * k3.R + k4.R),
    D: state.D + (dt / 6) * (k1.D + 2 * k2.D + 2 * k3.D + k4.D),
  };
}

function clampState(state: SEIRState): SEIRState {
  return {
    S: Math.max(0, state.S),
    E: Math.max(0, state.E),
    I: Math.max(0, state.I),
    R: Math.max(0, state.R),
    D: Math.max(0, state.D),
  };
}

// Compute temperature/humidity-modulated transmission rate
function computeBeta(
  baseBeta: number,
  avgTemp: number,
  humidity: number,
  maskCompliance: number,
  isolationIndex: number
): number {
  // Temperature effect: moderate temps increase transmission
  // Peak transmission around 10-15°C, decreases at extremes
  const tempFactor = 1 + 0.02 * Math.exp(-((avgTemp - 12) ** 2) / 100);

  // Humidity effect: moderate humidity (40-60%) increases transmission
  const humidityFactor = 1 + 0.1 * Math.exp(-((humidity - 50) ** 2) / 2000);

  // Mask compliance reduces effective contact
  const maskFactor = 1 - (maskCompliance / 100) * 0.6; // Max 60% reduction

  // Isolation reduces mixing
  const isolationFactor = 1 - isolationIndex * 0.7; // Max 70% reduction

  return Math.max(0.01, baseBeta * tempFactor * humidityFactor * maskFactor * isolationFactor);
}

/**
 * Solve single-node SEIR model
 */
export function solveSingleNodeSEIR(
  population: number,
  initialSEIR: SEIRState,
  params: SimulationParams,
  days: number,
  avgTemp: number,
  humidity: number,
  mobilityFlows: number[][] // [[day, inFlow], ...]
): SEIRState[] {
  const result: SEIRState[] = [];
  let state = { ...initialSEIR };

  for (let day = 0; day <= days; day++) {
    result.push({ ...state });

    if (day >= days) break;

    // Get mobility for this day
    const mob = mobilityFlows.find(([d]) => d === day) || [0, 0];
    const mobilityIn = mob[1];
    const mobilityOut = 0; // computed in network layer

    const currentBeta = computeBeta(
      params.beta,
      avgTemp,
      humidity,
      params.maskCompliance,
      params.isolationIndex
    );

    // Sub-stepping for accuracy (4 steps per day)
    const dt = 0.25;
    for (let step = 0; step < 4; step++) {
      state = rk4Step(state, dt, params, population, currentBeta, mobilityIn / 4, mobilityOut / 4);
    }

    state = clampState(state);

    // Ensure population doesn't grow beyond initial
    const total = state.S + state.E + state.I + state.R + state.D;
    if (total > population) {
      const scale = population / total;
      state = {
        S: state.S * scale,
        E: state.E * scale,
        I: state.I * scale,
        R: state.R * scale,
        D: state.D * scale,
      };
    }
  }

  return result;
}

/**
 * Verify population conservation: S + E + I + R + D = N at all times
 */
export function verifyPopulationConservation(
  trajectory: SEIRState[],
  expectedN: number,
  tolerance = 0.01
): { conserved: boolean; maxDrift: number; maxDriftDay: number } {
  let maxDrift = 0;
  let maxDriftDay = 0;

  for (let i = 0; i < trajectory.length; i++) {
    const total = trajectory[i].S + trajectory[i].E + trajectory[i].I + trajectory[i].R + trajectory[i].D;
    const drift = Math.abs(total - expectedN);
    if (drift > maxDrift) {
      maxDrift = drift;
      maxDriftDay = i;
    }
  }

  return {
    conserved: maxDrift < tolerance,
    maxDrift,
    maxDriftDay,
  };
}

/**
 * Compute R0 from parameters
 */
export function computeR0(beta: number, gamma: number, mu: number): number {
  return beta / (gamma + mu);
}

/**
 * Compute beta from desired R0
 */
export function computeBetaFromR0(r0: number, gamma: number, mu: number): number {
  return r0 * (gamma + mu);
}
