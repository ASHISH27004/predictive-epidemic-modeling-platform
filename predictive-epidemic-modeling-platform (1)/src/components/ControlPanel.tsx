/**
 * ControlPanel — Scenario Sandbox Sidebar
 * Interactive sliders and toggles for modifying simulation parameters.
 * Auto-triggers recalculation on slider release.
 */

import { useSimulation } from '../store/simulationStore';

export function ControlPanel() {
  const { state, dispatch, runSimulation } = useSimulation();
  const { params } = state;

  const handleParamChange = (key: string, value: number | boolean | string) => {
    dispatch({ type: 'SET_PARAMS', payload: { [key]: value } });
  };

  const handleSliderRelease = () => {
    runSimulation();
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="mb-5 px-1">
        <h2 className="text-sm font-bold text-teal-400 uppercase tracking-wider mb-1 flex items-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
          </svg>
          Scenario Parameters
        </h2>
        <p className="text-xs text-slate-500">Adjust variables and release to recalculate</p>
      </div>

      {/* Pathogen Properties */}
      <Section title="Pathogen Properties">
        <Slider
          label="R₀ (Reproduction Number)"
          value={params.r0}
          min={0.5}
          max={6}
          step={0.1}
          onChange={(v) => handleParamChange('r0', v)}
          onEnd={handleSliderRelease}
          displayValue={params.r0.toFixed(1)}
          color="amber"
        />
        <Slider
          label="Incubation Period (days)"
          value={1 / params.sigma}
          min={1}
          max={21}
          step={0.5}
          onChange={(v) => handleParamChange('sigma', 1 / v)}
          onEnd={handleSliderRelease}
          displayValue={params.sigma === 0 ? '∞' : (1 / params.sigma).toFixed(1)}
          color="blue"
        />
        <Slider
          label="Recovery Period (days)"
          value={1 / params.gamma}
          min={3}
          max={30}
          step={0.5}
          onChange={(v) => handleParamChange('gamma', 1 / v)}
          onEnd={handleSliderRelease}
          displayValue={(1 / params.gamma).toFixed(1)}
          color="green"
        />
        <Slider
          label="Mortality Rate (%)"
          value={params.mu * 100}
          min={0}
          max={5}
          step={0.05}
          onChange={(v) => handleParamChange('mu', v / 100)}
          onEnd={handleSliderRelease}
          displayValue={(params.mu * 100).toFixed(2)}
          color="red"
        />
        <Slider
          label="Initial Infections (thousands)"
          value={params.initialInfections * 1000}
          min={0.1}
          max={10}
          step={0.1}
          onChange={(v) => handleParamChange('initialInfections', v / 1000)}
          onEnd={handleSliderRelease}
          displayValue={params.initialInfections.toFixed(4) + 'M'}
          color="red"
        />
      </Section>

      {/* Interventions */}
      <Section title="Interventions">
        <Slider
          label="Global Isolation Index"
          value={params.isolationIndex}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => handleParamChange('isolationIndex', v)}
          onEnd={handleSliderRelease}
          displayValue={`${(params.isolationIndex * 100).toFixed(0)}%`}
          color="teal"
        />
        <Slider
          label="Mask Mandate Compliance (%)"
          value={params.maskCompliance}
          min={0}
          max={100}
          step={1}
          onChange={(v) => handleParamChange('maskCompliance', v)}
          onEnd={handleSliderRelease}
          displayValue={`${params.maskCompliance.toFixed(0)}%`}
          color="teal"
        />
        <Slider
          label="Mobility Reduction (%)"
          value={params.mobilityReduction * 100}
          min={0}
          max={100}
          step={1}
          onChange={(v) => handleParamChange('mobilityReduction', v / 100)}
          onEnd={handleSliderRelease}
          displayValue={`${(params.mobilityReduction * 100).toFixed(0)}%`}
          color="amber"
        />
        <Slider
          label="Daily Vaccination Rate (%)"
          value={params.vaccineRate}
          min={0}
          max={10}
          step={0.1}
          onChange={(v) => handleParamChange('vaccineRate', v)}
          onEnd={handleSliderRelease}
          displayValue={`${params.vaccineRate.toFixed(1)}%`}
          color="green"
        />
        <Slider
          label="Vaccine Efficacy (%)"
          value={params.vaccineEfficacy}
          min={0}
          max={100}
          step={1}
          onChange={(v) => handleParamChange('vaccineEfficacy', v)}
          onEnd={handleSliderRelease}
          displayValue={`${params.vaccineEfficacy.toFixed(0)}%`}
          color="green"
        />
      </Section>

      {/* Travel Restrictions */}
      <Section title="Travel Restrictions">
        <Toggle
          label="Apply Border Restrictions"
          checked={params.borderRestrictions}
          onChange={(v) => { handleParamChange('borderRestrictions', v); handleSliderRelease(); }}
        />
        <Toggle
          label="Full Flight Ban"
          checked={params.flightBan}
          onChange={(v) => { handleParamChange('flightBan', v); handleSliderRelease(); }}
        />
      </Section>

      {/* Run Button */}
      <button
        onClick={runSimulation}
        disabled={state.isRunning}
        className="w-full mt-4 mb-8 py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-200
          bg-gradient-to-r from-teal-500 to-cyan-600 text-white
          hover:from-teal-400 hover:to-cyan-500
          disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed
          active:scale-[0.98] shadow-lg shadow-teal-500/20"
      >
        {state.isRunning ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Computing Simulation...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Run Simulation
          </span>
        )}
      </button>

      {/* Verification Status */}
      {state.result && (
        <div className="mb-8">
          <div className={`p-3 rounded-lg border ${state.result.verification.populationConserved ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
            <div className="text-xs font-semibold text-emerald-400 mb-1">✓ Population Conservation Verified</div>
            <div className="text-xs text-slate-400">
              Max drift: {state.result.verification.maxDrift.toFixed(6)}M at day {state.result.verification.maxDriftDay}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 pb-1 border-b border-slate-700/50">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  onEnd: () => void;
  displayValue: string;
  color: string;
}

function Slider({ value, min, max, step, onChange, onEnd, displayValue, label, color }: SliderProps) {
  const accentColor = {
    amber: 'accent-amber-500',
    blue: 'accent-blue-500',
    green: 'accent-emerald-500',
    red: 'accent-red-500',
    teal: 'accent-teal-500',
  }[color] || 'accent-teal-500';

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <label className="text-xs text-slate-300">{label}</label>
        <span className="text-xs font-mono text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded">
          {displayValue}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        onMouseUp={onEnd}
        onTouchEnd={onEnd}
        className={`w-full h-1.5 rounded-full appearance-none cursor-pointer ${accentColor}`}
        style={{ accentColor: getColorHex(color) }}
      />
    </div>
  );
}

function getColorHex(color: string): string {
  return {
    amber: '#f59e0b',
    blue: '#3b82f6',
    green: '#10b981',
    red: '#ef4444',
    teal: '#14b8a6',
  }[color] || '#14b8a6';
}

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-slate-300">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
          checked ? 'bg-teal-500' : 'bg-slate-600'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
