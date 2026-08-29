import type { AtmosphericCityData, AtmosphericDataset, AtmosphericHour, CityName, PollutantKey, PollutantReading } from "./types";

const CITIES: { city: CityName; latitude: number; longitude: number }[] = [
  { city: "Karachi", latitude: 24.8607, longitude: 67.0011 }, { city: "Lahore", latitude: 31.5204, longitude: 74.3587 }, { city: "Islamabad", latitude: 33.6844, longitude: 73.0479 },
];
const AIR = ["us_aqi","us_aqi_pm2_5","us_aqi_pm10","us_aqi_nitrogen_dioxide","us_aqi_ozone","us_aqi_sulphur_dioxide","us_aqi_carbon_monoxide","pm2_5","pm10","nitrogen_dioxide","ozone","sulphur_dioxide","carbon_monoxide","aerosol_optical_depth","dust","uv_index"];
const WEATHER = ["temperature_2m","relative_humidity_2m","precipitation","rain","pressure_msl","visibility","cloud_cover","wind_speed_10m","wind_direction_10m","wind_gusts_10m","is_day"];
const pollutantMeta: Record<PollutantKey, { label: string; aqi?: string; unit: string }> = {
  pm2_5:{label:"PM2.5",aqi:"us_aqi_pm2_5",unit:"µg/m³"},pm10:{label:"PM10",aqi:"us_aqi_pm10",unit:"µg/m³"},nitrogen_dioxide:{label:"NO₂",aqi:"us_aqi_nitrogen_dioxide",unit:"µg/m³"},ozone:{label:"O₃",aqi:"us_aqi_ozone",unit:"µg/m³"},carbon_monoxide:{label:"CO",aqi:"us_aqi_carbon_monoxide",unit:"µg/m³"},sulphur_dioxide:{label:"SO₂",aqi:"us_aqi_sulphur_dioxide",unit:"µg/m³"},dust:{label:"Dust",unit:"µg/m³"},aerosol_optical_depth:{label:"AOD",unit:""},uv_index:{label:"UV",unit:"index"},
};
const numberAt = (obj: any, key: string, index: number) => { const v = obj?.[key]?.[index]; return typeof v === "number" && Number.isFinite(v) ? v : null; };

export function normalizeCity(city: CityName, air: any, weather: any, retrievedAt = new Date().toISOString()): AtmosphericCityData | null {
  const times: string[] = air?.hourly?.time; if (!Array.isArray(times)) return null;
  const weatherIndex = new Map((weather?.hourly?.time ?? []).map((t: string, i: number) => [t, i]));
  const hours: AtmosphericHour[] = times.slice(0, 96).map((time, i) => {
    const wi = Number(weatherIndex.get(time) ?? -1); const pollutants: Partial<Record<PollutantKey, PollutantReading>> = {};
    (Object.keys(pollutantMeta) as PollutantKey[]).forEach(key => { const m = pollutantMeta[key]; const concentration = numberAt(air.hourly, key, i); const aqi = m.aqi ? numberAt(air.hourly, m.aqi, i) : null; if (concentration !== null || aqi !== null) pollutants[key] = { key, label: m.label, unit: m.unit, concentration, aqi }; });
    return { time, aqi:numberAt(air.hourly,"us_aqi",i), temperature:numberAt(weather?.hourly,"temperature_2m",wi), humidity:numberAt(weather?.hourly,"relative_humidity_2m",wi), precipitation:numberAt(weather?.hourly,"precipitation",wi), rain:numberAt(weather?.hourly,"rain",wi), pressure:numberAt(weather?.hourly,"pressure_msl",wi), visibility:numberAt(weather?.hourly,"visibility",wi), cloudCover:numberAt(weather?.hourly,"cloud_cover",wi), windSpeed:numberAt(weather?.hourly,"wind_speed_10m",wi), windDirection:numberAt(weather?.hourly,"wind_direction_10m",wi), windGusts:numberAt(weather?.hourly,"wind_gusts_10m",wi), isDay:numberAt(weather?.hourly,"is_day",wi) === null ? null : numberAt(weather?.hourly,"is_day",wi) === 1, pollutants };
  });
  return { city, timezone: String(air.timezone ?? weather?.timezone ?? "Asia/Karachi"), retrievedAt, hours };
}
async function json(url: string) { const response = await fetch(url, { next: { revalidate: 1800 }, signal: AbortSignal.timeout(10000) }); if (!response.ok) throw new Error(`Open-Meteo ${response.status}`); return response.json(); }
async function fetchCity(c: typeof CITIES[number], retrievedAt: string) {
  const common = { latitude:String(c.latitude), longitude:String(c.longitude), timezone:"Asia/Karachi", forecast_hours:"96" };
  const airParams = new URLSearchParams({ ...common, hourly:AIR.join(",") }); const weatherParams = new URLSearchParams({ ...common, hourly:WEATHER.join(",") });
  try { const [air, weather] = await Promise.all([json(`https://air-quality-api.open-meteo.com/v1/air-quality?${airParams}`), json(`https://api.open-meteo.com/v1/forecast?${weatherParams}`)]); return normalizeCity(c.city, air, weather, retrievedAt); } catch { return null; }
}
export async function loadAtmosphericDataset(): Promise<AtmosphericDataset> { const retrievedAt = new Date().toISOString(); const results = await Promise.all(CITIES.map(c => fetchCity(c, retrievedAt))); const cities = results.filter((v): v is AtmosphericCityData => v !== null); return { cities, retrievedAt, unavailable: CITIES.filter(c => !cities.some(x => x.city === c.city)).map(c => c.city) }; }
