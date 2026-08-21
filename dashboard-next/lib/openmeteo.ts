export type WeatherDay = {
  date: string;
  weatherCode: number;
  temperatureMax: number;
  temperatureMin: number;
  precipitation: number;
  windSpeedMax: number;
};

export type CityWeatherOutlook = {
  city: string;
  timezone: string;
  fetchedAt: string;
  days: WeatherDay[];
};

const CITIES = [
  { city: "Karachi", latitude: 24.8607, longitude: 67.0011 },
  { city: "Lahore", latitude: 31.5204, longitude: 74.3587 },
  { city: "Islamabad", latitude: 33.6844, longitude: 73.0479 },
] as const;

export function parseWeatherOutlook(city: string, payload: any): CityWeatherOutlook | null {
  const daily = payload?.daily;
  if (!Array.isArray(daily?.time) || daily.time.length < 1) return null;
  const days = daily.time.slice(0, 3).map((date: string, index: number) => ({
    date,
    weatherCode: Number(daily.weather_code?.[index]),
    temperatureMax: Number(daily.temperature_2m_max?.[index]),
    temperatureMin: Number(daily.temperature_2m_min?.[index]),
    precipitation: Number(daily.precipitation_sum?.[index]),
    windSpeedMax: Number(daily.wind_speed_10m_max?.[index]),
  })).filter((day: WeatherDay) => Object.values(day).every((value) =>
    typeof value === "string" || Number.isFinite(value)
  ));
  if (!days.length) return null;
  return {
    city,
    timezone: String(payload.timezone ?? "Asia/Karachi"),
    fetchedAt: new Date().toISOString(),
    days,
  };
}

async function fetchCityWeather(config: (typeof CITIES)[number]): Promise<CityWeatherOutlook | null> {
  const params = new URLSearchParams({
    latitude: String(config.latitude),
    longitude: String(config.longitude),
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max",
    timezone: "Asia/Karachi",
    forecast_days: "3",
  });
  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    return parseWeatherOutlook(config.city, await response.json());
  } catch {
    return null;
  }
}

export async function loadWeatherOutlooks(): Promise<CityWeatherOutlook[]> {
  const results = await Promise.all(CITIES.map(fetchCityWeather));
  return results.filter((item): item is CityWeatherOutlook => item !== null);
}

export function weatherLabel(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 3) return "Partly cloudy";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 67) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Showers";
  if (code >= 95) return "Thunderstorms";
  return "Mixed conditions";
}
