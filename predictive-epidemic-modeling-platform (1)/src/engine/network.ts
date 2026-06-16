/**
 * City Transport Network Simulation
 * 
 * Models inter-city mobility and pathogen spread using a graph-based approach.
 * Cities are nodes, flights are weighted edges. Infected individuals move between
 * nodes proportionally to flight volumes, creating spatial spread cascades.
 */

import { cities } from '../data/cities';
import { flightRoutes } from '../data/flightNetwork';
import {
  solveSingleNodeSEIR,
  computeBetaFromR0,
  verifyPopulationConservation,
} from './seirSolver';
import { SEIRState, CityState, SimulationParams, SimulationResult } from '../types';

const cityIndexMap = new Map<string, number>();
cities.forEach((city, idx) => cityIndexMap.set(city.id, idx));

// Adjacency list: for each city, list of connected cities with flow data
interface AdjacencyEntry {
  targetId: string;
  targetIndex: number;
  weeklyPax: number;
  flightCount: number;
}

const adjacencyList = new Map<number, AdjacencyEntry[]>();

function buildGraph() {
  cities.forEach((_, idx) => adjacencyList.set(idx, []));

  for (const route of flightRoutes) {
    const fromIdx = cityIndexMap.get(route.from);
    const toIdx = cityIndexMap.get(route.to);
    if (fromIdx === undefined || toIdx === undefined) continue;

    adjacencyList.get(fromIdx)!.push({
      targetId: route.to,
      targetIndex: toIdx,
      weeklyPax: route.weeklyPax,
      flightCount: route.flightCount,
    });

    adjacencyList.get(toIdx)!.push({
      targetId: route.from,
      targetIndex: fromIdx,
      weeklyPax: route.weeklyPax,
      flightCount: route.flightCount,
    });
  }
}

buildGraph();

/**
 * Compute daily mobility flows between cities based on current infection states.
 * Infected individuals traveling on flights carry the pathogen.
 */
function computeMobilityFlows(
  dayStates: SEIRState[],
  params: SimulationParams
): Record<number, { inFlow: number; outFlow: number }> {
  const flows: Record<number, { inFlow: number; outFlow: number }> = {};

  for (let i = 0; i < cities.length; i++) {
    flows[i] = { inFlow: 0, outFlow: 0 };
  }

  for (const route of flightRoutes) {
    const fromIdx = cityIndexMap.get(route.from);
    const toIdx = cityIndexMap.get(route.to);
    if (fromIdx === undefined || toIdx === undefined) continue;

    // Daily fraction of weekly traffic
    const dailyPax = route.weeklyPax / 7; // thousands per day
    const fromCity = cities[fromIdx];
    const toCity = cities[toIdx];
    const fromSEIR = dayStates[fromIdx];
    const toSEIR = dayStates[toIdx];

    // Fraction of travelers who are infectious
    const fromInfectedFraction = fromSEIR.I / fromCity.population;
    const toInfectedFraction = toSEIR.I / toCity.population;

    // Mobility reduction factor
    const mobilityFactor = Math.max(0.05, 1 - params.mobilityReduction);

    // Border restrictions and flight bans
    let borderFactor = 1;
    if (params.borderRestrictions) {
      const crossContinent = fromCity.region !== toCity.region;
      borderFactor = crossContinent ? 0.2 : 0.8;
    }
    if (params.flightBan) {
      borderFactor *= 0.15;
    }

    // Daily infected travelers moving from source to destination (in millions)
    const infectedFromToDest = dailyPax / 1000 * fromInfectedFraction * mobilityFactor * borderFactor;
    const infectedDestToFrom = dailyPax / 1000 * toInfectedFraction * mobilityFactor * borderFactor;

    // Total travelers (not just infected) also move S/E/R
    const totalTravelers = dailyPax / 1000 * mobilityFactor * borderFactor;

    // Flow into destination: proportionally from source compartments
    const sFlowToDest = totalTravelers * (fromSEIR.S / fromCity.population);
    const eFlowToDest = totalTravelers * (fromSEIR.E / fromCity.population);
    const rFlowToDest = totalTravelers * (fromSEIR.R / fromCity.population);

    // Flow into source from destination
    const sFlowToSource = totalTravelers * (toSEIR.S / toCity.population);
    const eFlowToSource = totalTravelers * (toSEIR.E / toCity.population);
    const rFlowToSource = totalTravelers * (toSEIR.R / toCity.population);

    // We track total population flow for the solver
    flows[toIdx].inFlow += (sFlowToDest + eFlowToDest + infectedFromToDest + rFlowToDest);
    flows[fromIdx].outFlow += (sFlowToDest + eFlowToDest + infectedFromToDest + rFlowToDest);

    flows[fromIdx].inFlow += (sFlowToSource + eFlowToSource + infectedDestToFrom + rFlowToSource);
    flows[toIdx].outFlow += (sFlowToSource + eFlowToSource + infectedDestToFrom + rFlowToSource);
  }

  return flows;
}

/**
 * Run full multi-node SEIR simulation with mobility coupling
 */
export function runMultiNodeSimulation(
  params: SimulationParams
): SimulationResult {
  const simDays = params.simulationDays;
  const baseBeta = computeBetaFromR0(params.r0, params.gamma, params.mu);

  // Initialize states for all cities
  const initialStateMap: SEIRState[] = cities.map((city) => {
    if (city.id === params.patientZeroId) {
      // Patient zero: place initial infections
      return {
        S: city.population - params.initialInfections,
        E: params.initialInfections * 0.3,
        I: params.initialInfections * 0.5,
        R: params.initialInfections * 0.1,
        D: params.initialInfections * 0.1,
      };
    }
    return {
      S: city.population - 0.001,
      E: 0,
      I: 0.0005, // tiny seed
      R: 0.0005,
      D: 0,
    };
  });

  // Storage for results
  const cityData: Record<number, CityState[]> = {};
  const globalSummary: Record<number, SEIRState> = {};
  const allTrajectories: Record<number, SEIRState[]> = {};

  // Initialize day 0
  cityData[0] = cities.map((city, idx) => ({
    cityId: city.id,
    cityName: city.name,
    seir: { ...initialStateMap[idx] },
    population: city.population,
    infectionRate: initialStateMap[idx].I / city.population,
    prevalence: (initialStateMap[idx].I + initialStateMap[idx].E) / city.population,
    cumulativeDeaths: initialStateMap[idx].D,
  }));

  const g0 = initialStateMap.reduce(
    (acc, s) => ({
      S: acc.S + s.S, E: acc.E + s.E, I: acc.I + s.I, R: acc.R + s.R, D: acc.D + s.D,
    }),
    { S: 0, E: 0, I: 0, R: 0, D: 0 }
  );
  globalSummary[0] = g0;

  // Run simulation day by day
  let currentStates = [...initialStateMap];

  for (let day = 1; day <= simDays; day++) {
    // Compute mobility flows based on current states
    const flows = computeMobilityFlows(currentStates, params);

    // Evolve each city
    const nextStates: SEIRState[] = [];

    for (let ci = 0; ci < cities.length; ci++) {
      const city = cities[ci];
      const flow = flows[ci];

      // Build mobility flow array (inFlow only matters, outFlow handled as subtraction)
      const mobFlows: number[][] = [[day, flow.inFlow]];

      // Create per-city params with mobility
      const cityParams: SimulationParams = {
        ...params,
        beta: baseBeta,
      };

      // Single step forward with RK4 and mobility injection
      const trajectory = solveSingleNodeSEIR(
        city.population,
        currentStates[ci],
        cityParams,
        1, // just 1 day
        city.avgTemp,
        city.humidity,
        mobFlows
      );

      // Subtract outflow from susceptible (people leaving)
      let nextState = { ...trajectory[1] };
      nextState.S -= flow.outFlow * (currentStates[ci].S / city.population);
      nextState.E -= flow.outFlow * (currentStates[ci].E / city.population);
      nextState.I -= flow.outFlow * (currentStates[ci].I / city.population);
      nextState.R -= flow.outFlow * (currentStates[ci].R / city.population);

      // Clamp and renormalize
      const total = nextState.S + nextState.E + nextState.I + nextState.R + nextState.D;
      if (total !== city.population && total > 0) {
        const scale = city.population / total;
        nextState = {
          S: nextState.S * scale,
          E: nextState.E * scale,
          I: nextState.I * scale,
          R: nextState.R * scale,
          D: nextState.D * scale,
        };
      }

      nextStates.push(nextState);
    }

    currentStates = nextStates;

    // Store results
    cityData[day] = cities.map((city, idx) => ({
      cityId: city.id,
      cityName: city.name,
      seir: { ...currentStates[idx] },
      population: city.population,
      infectionRate: currentStates[idx].I / city.population,
      prevalence: (currentStates[idx].I + currentStates[idx].E) / city.population,
      cumulativeDeaths: currentStates[idx].D,
    }));

    const gs = currentStates.reduce(
      (acc, s) => ({
        S: acc.S + s.S, E: acc.E + s.E, I: acc.I + s.I, R: acc.R + s.R, D: acc.D + s.D,
      }),
      { S: 0, E: 0, I: 0, R: 0, D: 0 }
    );
    globalSummary[day] = gs;

    // Store trajectories for verification (sample every 10 days)
    if (day % 10 === 0) {
      cities.forEach((_, ci) => {
        if (!allTrajectories[ci]) allTrajectories[ci] = [];
        allTrajectories[ci].push({ ...currentStates[ci] });
      });
    }
  }

  // Verification
  let totalMaxDrift = 0;
  let totalMaxDriftDay = 0;
  let totalConserved = true;

  for (const ci of Object.keys(allTrajectories)) {
    const verif = verifyPopulationConservation(
      allTrajectories[Number(ci)],
      cities[Number(ci)].population
    );
    if (!verif.conserved) totalConserved = false;
    if (verif.maxDrift > totalMaxDrift) {
      totalMaxDrift = verif.maxDrift;
      totalMaxDriftDay = verif.maxDriftDay;
    }
  }

  // Also verify global conservation
  const globalTrajectory = Object.keys(globalSummary).map(Number).sort((a, b) => a - b);
  const globalPop = cities.reduce((sum, c) => sum + c.population, 0);
  for (const day of globalTrajectory) {
    const g = globalSummary[day];
    const total = g.S + g.E + g.I + g.R + g.D;
    const drift = Math.abs(total - globalPop);
    if (drift > totalMaxDrift) {
      totalMaxDrift = drift;
      totalMaxDriftDay = day;
    }
    if (drift > 1.0) totalConserved = false;
  }

  return {
    days: Array.from({ length: simDays + 1 }, (_, i) => i),
    cityData,
    globalSummary,
    verification: {
      populationConserved: totalConserved,
      maxDrift: totalMaxDrift,
      maxDriftDay: totalMaxDriftDay,
    },
  };
}

/**
 * Get all city IDs for dropdown/select
 */
export function getCityIds(): string[] {
  return cities.map((c) => c.id);
}

/**
 * Get city by ID
 */
export function getCityById(id: string) {
  return cities.find((c) => c.id === id);
}

export { cities, flightRoutes, adjacencyList, cityIndexMap };
