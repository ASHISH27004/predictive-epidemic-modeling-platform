/**
 * TimelineSlider — Playback control bar for simulating epidemic progression
 * Allows play/pause, speed control, and day-by-day navigation.
 */

import { useSimulation } from '../store/simulationStore';

export function TimelineSlider() {
  const { state, dispatch } = useSimulation();
  const { currentDay, isPlaying, playSpeed, result, params } = state;
  const totalDays = params.simulationDays;
  const progress = totalDays > 0 ? (currentDay / totalDays) * 100 : 0;

  // Global stats for current day
  const globalStats = result?.globalSummary[currentDay];

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border-t border-slate-700/50 px-4 py-3">
      {/* Stats row */}
      <div className="flex items-center gap-6 mb-2.5 text-xs">
        <span className="font-mono font-bold text-teal-400 text-sm">
          Day {currentDay} / {totalDays}
        </span>
        {globalStats && (
          <>
            <StatBadge label="I" value={`${globalStats.I.toFixed(3)}M`} color="text-red-400" />
            <StatBadge label="E" value={`${globalStats.E.toFixed(3)}M`} color="text-purple-400" />
            <StatBadge label="S" value={`${globalStats.S.toFixed(1)}M`} color="text-blue-400" />
            <StatBadge label="R" value={`${globalStats.R.toFixed(3)}M`} color="text-emerald-400" />
            <StatBadge label="D" value={`${globalStats.D.toFixed(4)}M`} color="text-amber-400" />
          </>
        )}
      </div>

      {/* Timeline */}
      <div className="flex items-center gap-3">
        {/* Play/Pause */}
        <button
          onClick={() => dispatch({ type: 'SET_PLAYING', payload: !isPlaying })}
          disabled={!result}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-teal-500/20 text-teal-400
            hover:bg-teal-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed
            border border-teal-500/30"
        >
          {isPlaying ? (
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="6 3 20 12 6 21" />
            </svg>
          )}
        </button>

        {/* Step buttons */}
        <button
          onClick={() => dispatch({ type: 'SET_CURRENT_DAY', payload: Math.max(0, currentDay - 1) })}
          disabled={!result}
          className="text-slate-400 hover:text-white transition-colors disabled:opacity-30"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button
          onClick={() => dispatch({ type: 'SET_CURRENT_DAY', payload: Math.min(totalDays, currentDay + 1) })}
          disabled={!result}
          className="text-slate-400 hover:text-white transition-colors disabled:opacity-30"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {/* Slider */}
        <div className="flex-1 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={totalDays}
            step={1}
            value={currentDay}
            onChange={(e) => {
              dispatch({ type: 'SET_PLAYING', payload: false });
              dispatch({ type: 'SET_CURRENT_DAY', payload: parseInt(e.target.value) });
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        {/* Speed selector */}
        <div className="flex items-center gap-1">
          {[1, 2, 5, 10].map((speed) => (
            <button
              key={speed}
              onClick={() => dispatch({ type: 'SET_PLAY_SPEED', payload: speed })}
              className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${
                playSpeed === speed
                  ? 'bg-teal-500/30 text-teal-400 border border-teal-500/40'
                  : 'text-slate-500 hover:text-slate-300 border border-transparent'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`font-bold ${color}`}>{label}</span>
      <span className="font-mono text-slate-300">{value}</span>
    </span>
  );
}
