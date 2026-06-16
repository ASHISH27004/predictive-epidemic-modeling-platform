// Flight route network between global mega-cities
// Based on approximate weekly flight frequencies (thousands of passengers)

export interface FlightRoute {
  from: string;
  to: string;
  weeklyPax: number; // thousands of passengers per week
  flightCount: number; // weekly flights
}

export const flightRoutes: FlightRoute[] = [
  // North America internal
  { from: 'nyc', to: 'lax', weeklyPax: 520, flightCount: 480 },
  { from: 'nyc', to: 'chi', weeklyPax: 380, flightCount: 390 },
  { from: 'lax', to: 'chi', weeklyPax: 290, flightCount: 310 },
  { from: 'nyc', to: 'tor', weeklyPax: 180, flightCount: 200 },
  { from: 'lax', to: 'tor', weeklyPax: 120, flightCount: 130 },
  // NA - Europe
  { from: 'nyc', to: 'lon', weeklyPax: 350, flightCount: 280 },
  { from: 'nyc', to: 'par', weeklyPax: 200, flightCount: 170 },
  { from: 'nyc', to: 'ber', weeklyPax: 90, flightCount: 70 },
  { from: 'lax', to: 'lon', weeklyPax: 160, flightCount: 130 },
  { from: 'nyc', to: 'mos', weeklyPax: 60, flightCount: 50 },
  // NA - South America
  { from: 'nyc', to: 'sao', weeklyPax: 140, flightCount: 120 },
  { from: 'nyc', to: 'mxo', weeklyPax: 200, flightCount: 210 },
  { from: 'lax', to: 'mxo', weeklyPax: 150, flightCount: 160 },
  { from: 'nyc', to: 'bue', weeklyPax: 60, flightCount: 45 },
  // Europe internal
  { from: 'lon', to: 'par', weeklyPax: 310, flightCount: 380 },
  { from: 'lon', to: 'ber', weeklyPax: 180, flightCount: 200 },
  { from: 'par', to: 'ber', weeklyPax: 150, flightCount: 170 },
  { from: 'lon', to: 'ist', weeklyPax: 120, flightCount: 130 },
  { from: 'par', to: 'ist', weeklyPax: 100, flightCount: 110 },
  { from: 'ber', to: 'mos', weeklyPax: 80, flightCount: 90 },
  { from: 'lon', to: 'mos', weeklyPax: 100, flightCount: 90 },
  // Europe - Asia
  { from: 'lon', to: 'dxb', weeklyPax: 280, flightCount: 260 },
  { from: 'par', to: 'dxb', weeklyPax: 160, flightCount: 150 },
  { from: 'lon', to: 'tok', weeklyPax: 130, flightCount: 110 },
  { from: 'lon', to: 'pek', weeklyPax: 110, flightCount: 90 },
  { from: 'ber', to: 'tok', weeklyPax: 70, flightCount: 60 },
  { from: 'ist', to: 'dxb', weeklyPax: 200, flightCount: 190 },
  // Middle East hub
  { from: 'dxb', to: 'sin', weeklyPax: 180, flightCount: 170 },
  { from: 'dxb', to: 'mum', weeklyPax: 220, flightCount: 230 },
  { from: 'dxb', to: 'pek', weeklyPax: 140, flightCount: 120 },
  { from: 'dxb', to: 'cai', weeklyPax: 100, flightCount: 90 },
  { from: 'dxb', to: 'lag', weeklyPax: 70, flightCount: 60 },
  { from: 'dxb', to: 'tok', weeklyPax: 100, flightCount: 90 },
  { from: 'dxb', to: 'jak', weeklyPax: 110, flightCount: 100 },
  // Asia internal
  { from: 'tok', to: 'pek', weeklyPax: 200, flightCount: 210 },
  { from: 'tok', to: 'seo', weeklyPax: 260, flightCount: 270 },
  { from: 'tok', to: 'sin', weeklyPax: 140, flightCount: 130 },
  { from: 'pek', to: 'shl', weeklyPax: 400, flightCount: 420 },
  { from: 'pek', to: 'mum', weeklyPax: 100, flightCount: 90 },
  { from: 'pek', to: 'ban', weeklyPax: 130, flightCount: 120 },
  { from: 'shl', to: 'tok', weeklyPax: 120, flightCount: 110 },
  { from: 'sin', to: 'ban', weeklyPax: 150, flightCount: 160 },
  { from: 'sin', to: 'jak', weeklyPax: 170, flightCount: 180 },
  { from: 'sin', to: 'mum', weeklyPax: 130, flightCount: 130 },
  { from: 'mum', to: 'ban', weeklyPax: 80, flightCount: 70 },
  { from: 'seo', to: 'pek', weeklyPax: 90, flightCount: 80 },
  { from: 'seo', to: 'sin', weeklyPax: 70, flightCount: 70 },
  // Asia - Oceania
  { from: 'tok', to: 'syd', weeklyPax: 100, flightCount: 90 },
  { from: 'sin', to: 'syd', weeklyPax: 120, flightCount: 120 },
  // South America internal
  { from: 'sao', to: 'bue', weeklyPax: 90, flightCount: 80 },
  { from: 'sao', to: 'mxo', weeklyPax: 60, flightCount: 55 },
  // Africa
  { from: 'lag', to: 'cai', weeklyPax: 50, flightCount: 40 },
  { from: 'lag', to: 'lon', weeklyPax: 100, flightCount: 90 },
  { from: 'nbo', to: 'dxb', weeklyPax: 80, flightCount: 70 },
  { from: 'cai', to: 'ist', weeklyPax: 90, flightCount: 90 },
  { from: 'nbo', to: 'lag', weeklyPax: 40, flightCount: 35 },
  // Cross-continental
  { from: 'lax', to: 'tok', weeklyPax: 110, flightCount: 90 },
  { from: 'lax', to: 'syd', weeklyPax: 90, flightCount: 80 },
  { from: 'nyc', to: 'sin', weeklyPax: 70, flightCount: 60 },
  { from: 'lax', to: 'seo', weeklyPax: 80, flightCount: 70 },
];
