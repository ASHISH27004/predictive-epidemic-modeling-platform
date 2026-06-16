/**
 * Geomap — Interactive Leaflet-based global map
 * Renders city nodes colored by infection rate, flight paths as connections,
 * and responds to timeline changes.
 */

import { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useSimulation } from '../store/simulationStore';
import { cities } from '../data/cities';
import { flightRoutes } from '../data/flightNetwork';

// Fix for default marker icons — Leaflet CDN handles this

// Infection rate color scale
function getInfectionColor(rate: number): string {
  if (rate <= 0) return '#1a2332';
  if (rate < 0.001) return '#065f46'; // dark green
  if (rate < 0.005) return '#059669'; // green
  if (rate < 0.01) return '#65a30d';  // lime
  if (rate < 0.02) return '#84cc16';  // chartreuse
  if (rate < 0.05) return '#eab308';  // yellow
  if (rate < 0.1) return '#f59e0b';   // amber
  if (rate < 0.2) return '#f97316';   // orange
  if (rate < 0.4) return '#ef4444';   // red
  return '#991b1b';                    // dark red
}

function getMarkerRadius(infectionRate: number, population: number): number {
  const base = Math.sqrt(population) * 1.8;
  const infectionBoost = 1 + infectionRate * 100;
  return Math.max(4, Math.min(base * infectionBoost, 30));
}

// Component to update map center when needed
function MapUpdater() {
  useMap();
  return null;
}

// Pulse animation for flight paths
function addPulseAnimation(map: L.Map) {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse-opacity {
      0% { opacity: 0.3; }
      50% { opacity: 0.8; }
      100% { opacity: 0.3; }
    }
    .flight-path-pulse {
      animation: pulse-opacity 2s ease-in-out infinite;
    }
  `;
  map.getContainer().appendChild(style);
}

export function Geomap() {
  const { state } = useSimulation();
  const mapRef = useRef<L.Map | null>(null);
  const currentDay = state.currentDay;
  const result = state.result;
  const isDay = state.isDayMode;

  const tileUrl = isDay
    ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  useEffect(() => {
    if (mapRef.current) {
      addPulseAnimation(mapRef.current);
    }
  }, []);

  // City data for current day
  const cityStates = useMemo(() => {
    if (!result || !result.cityData[currentDay]) return null;
    return result.cityData[currentDay];
  }, [result, currentDay]);

  // Flight path data
  const flightPaths = useMemo(() => {
    if (!cityStates) return [];

    const cityMap = new Map<string, typeof cityStates[0]>();
    cityStates.forEach((cs) => cityMap.set(cs.cityId, cs));

    return flightRoutes.map((route) => {
      const fromCity = cities.find((c) => c.id === route.from);
      const toCity = cities.find((c) => c.id === route.to);
      if (!fromCity || !toCity) return null;

      const fromState = cityMap.get(route.from);
      const toState = cityMap.get(route.to);
      if (!fromState || !toState) return null;

      // Intensity based on combined infection rates
      const intensity = (fromState.infectionRate + toState.infectionRate) * 50;

      // Adjust for restrictions
      let adjustedIntensity = intensity;
      if (state.params.borderRestrictions) {
        adjustedIntensity *= fromCity.region !== toCity.region ? 0.2 : 0.8;
      }
      if (state.params.flightBan) {
        adjustedIntensity *= 0.15;
      }

      return {
        from: [fromCity.lat, fromCity.lng] as [number, number],
        to: [toCity.lat, toCity.lng] as [number, number],
        intensity: Math.min(adjustedIntensity, 1),
        weeklyPax: route.weeklyPax,
      };
    }).filter(Boolean) as Array<{ from: [number, number]; to: [number, number]; intensity: number; weeklyPax: number }>;
  }, [cityStates, state.params]);

  // Create curved flight paths
  const getCurvedPath = (from: [number, number], to: [number, number]): [number, number][] => {
    const midLat = (from[0] + to[0]) / 2;
    const midLng = (from[1] + to[1]) / 2;
    const dist = Math.sqrt((from[0] - to[0]) ** 2 + (from[1] - to[1]) ** 2);
    const arcHeight = Math.min(dist * 0.3, 8);

    // Perpendicular offset
    const dx = to[1] - from[1];
    const dy = to[0] - from[0];
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const perpX = -dy / len * arcHeight;
    const perpY = dx / len * arcHeight;

    const ctrlLat = midLat + perpY * 0.3;
    const ctrlLng = midLng + perpX * 0.3;

    const points: [number, number][] = [];
    for (let t = 0; t <= 1; t += 0.05) {
      const lat = (1 - t) ** 2 * from[0] + 2 * (1 - t) * t * ctrlLat + t ** 2 * to[0];
      const lng = (1 - t) ** 2 * from[1] + 2 * (1 - t) * t * ctrlLng + t ** 2 * to[1];
      points.push([lat, lng]);
    }
    return points;
  };

  return (
    <div className={`w-full h-full relative rounded-xl overflow-hidden border ${isDay ? 'border-slate-300/50' : 'border-slate-700/50'}`}>
      {/* Map overlay info */}
      <div className={`absolute top-3 left-3 z-[1000] backdrop-blur-md rounded-lg px-3 py-2 border ${isDay ? 'bg-white/90 border-slate-300/50' : 'bg-slate-800/90 border-slate-600/30'}`}>
        <div className="text-xs font-mono text-teal-400">Day {currentDay}</div>
      </div>

      {/* Cloud overlay */}
      <div className={`sky-clouds-overlay ${isDay ? 'sky-day' : 'sky-night'}`} />

      {/* Legend */}
      <div className={`absolute bottom-3 left-3 z-[1000] backdrop-blur-md rounded-lg px-3 py-2 border ${isDay ? 'bg-white/90 border-slate-300/50' : 'bg-slate-800/90 border-slate-600/30'}`}>
        <div className={`text-xs font-semibold mb-1.5 ${isDay ? 'text-slate-700' : 'text-slate-300'}`}>Infection Rate</div>
        <div className="text-xs font-semibold text-slate-300 mb-1.5">Infection Rate</div>
        <div className="flex items-center gap-0.5">
          {['#065f46', '#059669', '#65a30d', '#84cc16', '#eab308', '#f59e0b', '#f97316', '#ef4444', '#991b1b'].map((c, i) => (
            <div key={i} className="w-4 h-3 rounded-sm" style={{ backgroundColor: c }} />
          ))}
        </div>
        <div className="flex justify-between mt-0.5">
          <span className={`text-[10px] ${isDay ? 'text-slate-500' : 'text-slate-500'}`}>0%</span>
          <span className={`text-[10px] ${isDay ? 'text-slate-500' : 'text-slate-500'}`}>40%+</span>
        </div>
      </div>

      <MapContainer
        center={[20, 0]}
        zoom={2.5}
        style={{ height: '100%', width: '100%' }}
        className={`z-0 ${isDay ? 'sky-day-bg' : 'sky-night-bg'}`}
        ref={mapRef}
        zoomControl={true}
        attributionControl={true}
      >
        <TileLayer
          url={tileUrl}
          attribution="&copy; OpenStreetMap contributors &copy; CARTO"
        />

        {/* Flight paths */}
        {flightPaths.map((fp, idx) => {
          if (fp.intensity < 0.02) return null;
          const points = getCurvedPath(fp.from, fp.to);
          const opacity = 0.1 + fp.intensity * 0.7;
          const weight = 0.5 + fp.intensity * 2.5;
          const color = fp.intensity > 0.5 ? '#ef4444' : fp.intensity > 0.2 ? '#f59e0b' : '#3b82f6';

          return (
            <Polyline
              key={`flight-${idx}`}
              positions={points}
              pathOptions={{
                color,
                weight,
                opacity,
                dashArray: fp.intensity > 0.6 ? undefined : '4,4',
                className: fp.intensity > 0.3 ? 'flight-path-pulse' : '',
              }}
            >
              <Popup>
                <div className="text-xs">
                  <div className="font-semibold">{fp.weeklyPax}K pax/week</div>
                  <div className="text-slate-500">Intensity: {(fp.intensity * 100).toFixed(0)}%</div>
                </div>
              </Popup>
            </Polyline>
          );
        })}

        {/* City markers */}
        {cities.map((city, idx) => {
          const cs = cityStates?.[idx];
          const rate = cs?.infectionRate || 0;
          const color = getInfectionColor(rate);
          const radius = getMarkerRadius(rate, city.population);
          const seir = cs?.seir;

          return (
            <CircleMarker
              key={city.id}
              center={[city.lat, city.lng]}
              radius={radius}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.8,
                weight: 1.5,
                opacity: 0.9,
              }}
            >
              <Popup>
                <div className="text-xs min-w-[160px]">
                  <div className="font-bold text-sm mb-1">{city.name}, {city.country}</div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px]">
                    <span className="text-slate-500">Population:</span>
                    <span className="text-right font-mono">{city.population}M</span>
                    <span className="text-slate-500">Susceptible:</span>
                    <span className="text-right font-mono text-blue-400">{seir?.S.toFixed(3)}M</span>
                    <span className="text-slate-500">Exposed:</span>
                    <span className="text-right font-mono text-purple-400">{seir?.E.toFixed(4)}M</span>
                    <span className="text-slate-500">Infectious:</span>
                    <span className="text-right font-mono text-red-400">{seir?.I.toFixed(4)}M</span>
                    <span className="text-slate-500">Recovered:</span>
                    <span className="text-right font-mono text-green-400">{seir?.R.toFixed(3)}M</span>
                    <span className="text-slate-500">Deceased:</span>
                    <span className="text-right font-mono text-amber-400">{seir?.D.toFixed(4)}M</span>
                    <span className="text-slate-500">Infection Rate:</span>
                    <span className="text-right font-mono">{(rate * 100).toFixed(3)}%</span>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        <MapUpdater />
      </MapContainer>
    </div>
  );
}
