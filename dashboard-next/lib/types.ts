export const CITIES = ["Karachi", "Lahore", "Islamabad"] as const;

export type City = (typeof CITIES)[number];

export type AQICategory =
  | "Good"
  | "Moderate"
  | "Unhealthy for Sensitive Groups"
  | "Unhealthy"
  | "Very Unhealthy"
  | "Hazardous";

export interface Pollutants {
  pm2_5: number | null;
  pm10: number | null;
  nitrogen_dioxide: number | null;
  sulphur_dioxide: number | null;
  carbon_monoxide: number | null;
  ozone: number | null;
}

export interface Weather {
  temperature_2m: number | null;
  relative_humidity_2m: number | null;
  wind_speed_10m: number | null;
  wind_direction_10m: number | null;
  surface_pressure: number | null;
  precipitation: number | null;
}

export interface LatestObservation extends Pollutants, Weather {
  city: City;
  timestamp: string;
  us_aqi: number | null;
}

export interface ForecastPoint {
  aqi: number;
  category: AQICategory;
  timestamp: string;
}

export interface ForecastResponse {
  city: City;
  generated_at: string;
  model: string;
  model_version: number;
  latest_observation: LatestObservation | null;
  forecasts: Record<"24h" | "48h" | "72h", ForecastPoint>;
  data_status?: "live" | "cached";
}

export interface ValidationMetrics {
  overall_rmse: number;
  mae: number;
  r2: number;
  "24h_rmse"?: number;
  "48h_rmse"?: number;
  "72h_rmse"?: number;
  r2_24h?: number;
  r2_48h?: number;
  r2_72h?: number;
}

export interface ModelInfo {
  model: string;
  model_selection_split: string;
  model_selection_note: string;
  validation_metrics: ValidationMetrics;
  final_test_metrics: ValidationMetrics;
  training_time_seconds?: number;
}


export interface HealthResponse {
  status: string;
  model_ready: boolean;
  forecast_ready: boolean;
}
