/**
 * PatientZeroSelector — Dropdown to select Patient Zero city
 */

import { useSimulation } from '../store/simulationStore';
import { cities } from '../data/cities';

export function PatientZeroSelector() {
  const { state, dispatch } = useSimulation();

  return (
    <div>
      <label className="text-xs text-slate-300 block mb-1.5">Patient Zero Location</label>
      <select
        value={state.params.patientZeroId}
        onChange={(e) => dispatch({ type: 'SET_PARAMS', payload: { patientZeroId: e.target.value } })}
        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white
          focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50
          appearance-none cursor-pointer"
      >
        {cities.map((city) => (
          <option key={city.id} value={city.id}>
            {city.name}, {city.country} ({city.population}M)
          </option>
        ))}
      </select>
    </div>
  );
}
