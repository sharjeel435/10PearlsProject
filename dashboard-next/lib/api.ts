import {
  CITIES,
  type AQICategory,
  type City,
  type ForecastResponse,
  type HealthResponse,
  type LatestObservation,
  type ModelInfo,
} from "./types";

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

export const normalizeApiBaseUrl = (value: string | undefined) =>
  (value ?? "").trim().replace(/\/+$/, "");
const base = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);

async function request<T>(route: string): Promise<T> {
  if (!base) throw new ApiError("API origin is not configured");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${base}${route}`, {
      signal: controller.signal,
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new ApiError(
        "Forecast service is temporarily unavailable",
        response.status
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("Unable to reach the forecast service");
  } finally {
    clearTimeout(timer);
  }
}

export function normalizeForecast(payload: Record<string, unknown>): ForecastResponse {
  if (!isCity(String(payload.city)) || !payload.generated_at) {
    throw new ApiError("Forecast response is invalid");
  }

  if (payload.forecasts) return payload as unknown as ForecastResponse;

  return {
    city: String(payload.city) as City,
    generated_at: String(payload.generated_at),
    model: String(payload.model),
    model_version: Number(payload.model_version),
    latest_observation: (payload.latest_observation ?? null) as LatestObservation | null,
    forecasts: {
      "24h": {
        aqi: Number(payload.predicted_aqi_24h),
        category: String(payload.category_24h) as AQICategory,
        timestamp: String(payload.forecast_for_24h),
      },
      "48h": {
        aqi: Number(payload.predicted_aqi_48h),
        category: String(payload.category_48h) as AQICategory,
        timestamp: String(payload.forecast_for_48h),
      },
      "72h": {
        aqi: Number(payload.predicted_aqi_72h),
        category: String(payload.category_72h) as AQICategory,
        timestamp: String(payload.forecast_for_72h),
      },
    },
  };
}

export const getCities = () => request<City[]>("/cities");

export const getForecast = async (city: City) =>
  normalizeForecast(
    await request<Record<string, any>>(
      `/forecast/${encodeURIComponent(city)}`
    )
  );

export const getModelInfo = () => request<ModelInfo>("/model-info");

export const getHealth = () => request<HealthResponse>("/health");

export function isCity(value: string): value is City {
  return (CITIES as readonly string[]).includes(value);
}

export function resolveCity(
  value: string | null,
  fallback: City = "Karachi"
): City {
  return value && isCity(value) ? value : fallback;
}
