/**
 * ChartPanel — Multi-panel forecasting charts using Recharts
 * Shows global SEIR evolution, regional breakdowns, and mortality trends.
 */

import { useMemo } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useSimulation } from '../store/simulationStore';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatTooltip = (value: any) => {
  if (value === undefined) return ['N/A', ''];
  return [`${Number(value).toFixed(3)}M`, ''];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatDeltaTooltip = (value: any) => {
  if (value === undefined) return ['N/A', 'New Cases'];
  return [`${Number(value).toFixed(4)}M`, 'New Cases'];
};

export function ChartPanel() {
  const { state } = useSimulation();
  const result = state.result;

  const chartData = useMemo(() => {
    if (!result) return [];

    return result.days.map((day) => {
      const global = result.globalSummary[day];
      return {
        day,
        susceptible: Math.round(global.S * 1000) / 1000,
        exposed: Math.round(global.E * 1000) / 1000,
        infectious: Math.round(global.I * 1000) / 1000,
        recovered: Math.round(global.R * 1000) / 1000,
        deceased: Math.round(global.D * 1000) / 1000,
        totalInfected: Math.round((global.I + global.E) * 1000) / 1000,
        totalAffected: Math.round((global.I + global.E + global.R + global.D) * 1000) / 1000,
      };
    });
  }, [result]);

  // Peak detection
  const peakInfo = useMemo(() => {
    if (!result || chartData.length === 0) return null;
    const peakIdx = chartData.reduce((max, d, i) =>
      d.infectious > (chartData[max]?.infectious ?? 0) ? i : max, 0);
    const peak = chartData[peakIdx];
    const current = chartData[state.currentDay] || chartData[0];
    return { peakDay: peak?.day || 0, peakInfectious: peak?.infectious || 0, currentInfectious: current?.infectious || 0 };
  }, [chartData, state.currentDay, result]);

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-20 h-20 mb-4 rounded-2xl bg-slate-800 flex items-center justify-center border border-slate-700">
          <svg className="w-10 h-10 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 16l4-8 4 4 5-9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-300 mb-1">No Simulation Data</h3>
        <p className="text-sm text-slate-500 max-w-xs">
          Configure parameters in the control panel and run a simulation to see forecasts.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-1">
      {/* Peak Info Cards */}
      {peakInfo && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <InfoCard label="Peak Day" value={`Day ${peakInfo.peakDay}`} color="amber" />
          <InfoCard label="Peak Infected" value={`${peakInfo.peakInfectious.toFixed(2)}M`} color="red" />
          <InfoCard label="Current Infected" value={`${peakInfo.currentInfectious.toFixed(2)}M`} color="teal" />
        </div>
      )}

      {/* Main SEIR Chart */}
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Global SEIR Trajectory
        </h3>
        <div className="h-[200px] bg-slate-800/40 rounded-lg border border-slate-700/50 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradS" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradE" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="day"
                label={{ value: 'Days', position: 'insideBottomRight', offset: -5, fill: '#64748b', fontSize: 10 }}
                stroke="#475569"
                fontSize={10}
                tickCount={12}
              />
              <YAxis
                label={{ value: 'Millions', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
                stroke="#475569"
                fontSize={10}
                tickFormatter={(v: number) => `${v}M`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
                formatter={formatTooltip}
              />
              <Legend
                wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }}
                iconType="circle"
              />
              <Area type="monotone" dataKey="susceptible" name="Susceptible" stroke="#3b82f6" fill="url(#gradS)" strokeWidth={1.5} />
              <Area type="monotone" dataKey="exposed" name="Exposed" stroke="#a855f7" fill="url(#gradE)" strokeWidth={1.5} />
              <Area type="monotone" dataKey="infectious" name="Infectious" stroke="#ef4444" fill="url(#gradI)" strokeWidth={2} />
              <Area type="monotone" dataKey="recovered" name="Recovered" stroke="#10b981" fill="url(#gradR)" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Active Cases + Mortality */}
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Active Cases & Mortality
        </h3>
        <div className="h-[180px] bg-slate-800/40 rounded-lg border border-slate-700/50 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="day"
                stroke="#475569"
                fontSize={10}
                tickCount={10}
              />
              <YAxis
                stroke="#475569"
                fontSize={10}
                tickFormatter={(v: number) => `${v}M`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
                formatter={formatTooltip}
              />
              <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} iconType="circle" />
              <Line type="monotone" dataKey="totalInfected" name="Active (I+E)" stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="deceased" name="Cumulative Deaths" stroke="#ef4444" strokeWidth={2} dot={false} strokeDasharray="4 2" />
              <Line type="monotone" dataKey="totalAffected" name="Total Affected" stroke="#6366f1" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily New Cases (derived) */}
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Daily New Infections (ΔI)
        </h3>
        <div className="h-[160px] bg-slate-800/40 rounded-lg border border-slate-700/50 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.slice(1).map((d, i) => ({
              day: d.day,
              delta: Math.max(0, chartData[i]?.infectious ? d.infectious - chartData[i].infectious : 0),
            }))} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" stroke="#475569" fontSize={10} tickCount={10} />
              <YAxis stroke="#475569" fontSize={10} tickFormatter={(v: number) => `${v}M`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
                formatter={formatDeltaTooltip}
              />
              <Bar dataKey="delta" name="Δ New Infections" fill="#f59e0b" fillOpacity={0.6} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value, color }: { label: string; value: string; color: string }) {
  const bgColors = {
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    red: 'bg-red-500/10 border-red-500/30 text-red-400',
    teal: 'bg-teal-500/10 border-teal-500/30 text-teal-400',
  }[color] || 'bg-teal-500/10 border-teal-500/30 text-teal-400';

  return (
    <div className={`p-2.5 rounded-lg border ${bgColors}`}>
      <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">{label}</div>
      <div className="text-sm font-bold font-mono mt-0.5">{value}</div>
    </div>
  );
}
