// Global mega-city dataset with population, coordinates, and climate data

export interface CityNode {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  population: number; // in millions
  region: 'NA' | 'SA' | 'EU' | 'AF' | 'AS' | 'OC';
  avgTemp: number; // Celsius, annual average
  humidity: number; // percentage
}

export const cities: CityNode[] = [
  { id: 'nyc', name: 'New York', country: 'USA', lat: 40.7128, lng: -74.006, population: 8.3, region: 'NA', avgTemp: 12.8, humidity: 62 },
  { id: 'lax', name: 'Los Angeles', country: 'USA', lat: 34.0522, lng: -118.2437, population: 3.9, region: 'NA', avgTemp: 18.6, humidity: 65 },
  { id: 'chi', name: 'Chicago', country: 'USA', lat: 41.8781, lng: -87.6298, population: 2.7, region: 'NA', avgTemp: 10.0, humidity: 68 },
  { id: 'lon', name: 'London', country: 'UK', lat: 51.5074, lng: -0.1278, population: 8.9, region: 'EU', avgTemp: 11.3, humidity: 78 },
  { id: 'par', name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522, population: 2.2, region: 'EU', avgTemp: 12.3, humidity: 75 },
  { id: 'ber', name: 'Berlin', country: 'Germany', lat: 52.52, lng: 13.405, population: 3.6, region: 'EU', avgTemp: 9.7, humidity: 72 },
  { id: 'mos', name: 'Moscow', country: 'Russia', lat: 55.7558, lng: 37.6173, population: 12.5, region: 'EU', avgTemp: 5.8, humidity: 76 },
  { id: 'dxb', name: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708, population: 3.3, region: 'AS', avgTemp: 26.9, humidity: 60 },
  { id: 'tok', name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503, population: 13.9, region: 'AS', avgTemp: 15.4, humidity: 63 },
  { id: 'pek', name: 'Beijing', country: 'China', lat: 39.9042, lng: 116.4074, population: 21.5, region: 'AS', avgTemp: 12.9, humidity: 54 },
  { id: 'sin', name: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198, population: 5.7, region: 'AS', avgTemp: 27.0, humidity: 84 },
  { id: 'mum', name: 'Mumbai', country: 'India', lat: 19.076, lng: 72.8777, population: 20.4, region: 'AS', avgTemp: 27.2, humidity: 72 },
  { id: 'del', name: 'Delhi', country: 'India', lat: 28.7041, lng: 77.1025, population: 30.3, region: 'AS', avgTemp: 23.6, humidity: 56 },
  { id: 'shl', name: 'Shanghai', country: 'China', lat: 31.2304, lng: 121.4737, population: 24.9, region: 'AS', avgTemp: 15.8, humidity: 70 },
  { id: 'syd', name: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093, population: 5.3, region: 'OC', avgTemp: 17.6, humidity: 66 },
  { id: 'sao', name: 'São Paulo', country: 'Brazil', lat: -23.5505, lng: -46.6333, population: 12.3, region: 'SA', avgTemp: 20.0, humidity: 76 },
  { id: 'mxo', name: 'Mexico City', country: 'Mexico', lat: 19.4326, lng: -99.1332, population: 9.2, region: 'NA', avgTemp: 16.5, humidity: 55 },
  { id: 'lag', name: 'Lagos', country: 'Nigeria', lat: 6.5244, lng: 3.3792, population: 15.4, region: 'AF', avgTemp: 27.0, humidity: 75 },
  { id: 'cai', name: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357, population: 10.1, region: 'AF', avgTemp: 21.4, humidity: 56 },
  { id: 'ban', name: 'Bangkok', country: 'Thailand', lat: 13.7563, lng: 100.5018, population: 10.5, region: 'AS', avgTemp: 28.6, humidity: 72 },
  { id: 'ist', name: 'Istanbul', country: 'Turkey', lat: 41.0082, lng: 28.9784, population: 15.5, region: 'EU', avgTemp: 14.2, humidity: 72 },
  { id: 'seo', name: 'Seoul', country: 'South Korea', lat: 37.5665, lng: 126.978, population: 9.7, region: 'AS', avgTemp: 12.5, humidity: 65 },
  { id: 'tor', name: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832, population: 2.7, region: 'NA', avgTemp: 9.4, humidity: 70 },
  { id: 'bue', name: 'Buenos Aires', country: 'Argentina', lat: -34.6037, lng: -58.3816, population: 3.1, region: 'SA', avgTemp: 17.7, humidity: 70 },
  { id: 'jak', name: 'Jakarta', country: 'Indonesia', lat: -6.2088, lng: 106.8456, population: 10.6, region: 'AS', avgTemp: 27.3, humidity: 80 },
  { id: 'nbo', name: 'Nairobi', country: 'Kenya', lat: -1.2921, lng: 36.8219, population: 4.7, region: 'AF', avgTemp: 18.3, humidity: 68 },
];
