import { calculateCityInsights, type CityHorizonInsights, type HourlyAirQuality, type HourlyWeather } from "./air-quality-insights";

const CITIES = [
  { city: "Karachi", latitude: 24.8607, longitude: 67.0011 },
  { city: "Lahore", latitude: 31.5204, longitude: 74.3587 },
  { city: "Islamabad", latitude: 33.6844, longitude: 73.0479 },
] as const;

type Numeric = number | null;

function finite(value: unknown): Numeric {
  const numeric = Number(value);
  return value !== null && value !== undefined && Number.isFinite(numeric) ? numeric : null;
}

/** Convert the two already-approved Open-Meteo hourly feeds into the pure rule engine's input. */
export function parseCityInsightFeeds(city: string, airPayload: any, weatherPayload: any): CityHorizonInsights[] {
  const airHourly = airPayload?.hourly;
  const weatherHourly = weatherPayload?.hourly;
  if (!Array.isArray(airHourly?.time) || !Array.isArray(weatherHourly?.time)) return [];

  const air: HourlyAirQuality[] = airHourly.time.map((time: string, index: number) => ({
    time,
    aqi: finite(airHourly.us_aqi?.[index]),
    pm25: finite(airHourly.pm2_5?.[index]),
  }));
  const weather: HourlyWeather[] = weatherHourly.time.map((time: string, index: number) => ({
    time,
    windSpeed: finite(weatherHourly.wind_speed_10m?.[index]),
    boundaryLayerHeight: finite(weatherHourly.boundary_layer_height?.[index]),
    surfacePressure: finite(weatherHourly.surface_pressure?.[index]),
  }));
  return calculateCityInsights(city, air, weather);
}

async function fetchCityInsights(config: (typeof CITIES)[number]): Promise<CityHorizonInsights[]> {
  const common = { latitude: String(config.latitude), longitude: String(config.longitude), timezone: "Asia/Karachi", forecast_days: "3" };
  const airParams = new URLSearchParams({ ...common, hourly: "us_aqi,pm2_5" });
  const weatherParams = new URLSearchParams({
    ...common,
    hourly: "wind_speed_10m,boundary_layer_height,surface_pressure",
    wind_speed_unit: "kmh",
  });
  try {
    const [airResponse, weatherResponse] = await Promise.all([
      fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${airParams}`, {
        next: { revalidate: 1800 }, signal: AbortSignal.timeout(8000),
      }),
      fetch(`https://api.open-meteo.com/v1/forecast?${weatherParams}`, {
        next: { revalidate: 1800 }, signal: AbortSignal.timeout(8000),
      }),
    ]);
    if (!airResponse.ok || !weatherResponse.ok) return [];
    return parseCityInsightFeeds(config.city, await airResponse.json(), await weatherResponse.json());
  } catch {
    return [];
  }
}

export async function loadLiveInsights(): Promise<CityHorizonInsights[]> {
  return (await Promise.all(CITIES.map(fetchCityInsights))).flat();
}
