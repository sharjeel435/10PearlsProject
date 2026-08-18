import fs from "node:fs/promises";
import path from "node:path";
import Papa from "papaparse";

const artifact = (name: string) => path.join(process.cwd(), "data", name);

async function json<T>(name: string): Promise<T> {
  return JSON.parse(await fs.readFile(artifact(name), "utf8")) as T;
}

async function csv<T>(name: string): Promise<T[]> {
  const parsed = Papa.parse<T>(await fs.readFile(artifact(name), "utf8"), {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });
  return parsed.data;
}

export type Forecast = {
  city: string;
  generated_at: string;
  model: string;
  model_version: number;
  [key: string]: string | number;
};

export type ModelMetric = {
  model: string;
  "24h_rmse": number;
  "48h_rmse": number;
  "72h_rmse": number;
  overall_rmse: number;
  mae: number;
  r2: number;
  training_time_seconds: number;
};

export async function loadDashboardData() {
  const [forecasts, observations, historical, models, training, quality, leakage, best, cityMetrics, features, individual] = await Promise.all([
    json<Forecast[]>("latest_forecasts.json"),
    json<Record<string, any>[]>("latest_observations.json"),
    json<Record<string, any>[]>("historical_daily_30d.json"),
    csv<ModelMetric>("model_comparison.csv"),
    json<Record<string, any>>("training_summary.json"),
    json<Record<string, any>>("data_quality_report.json"),
    json<Record<string, string>>("leakage_report.json"),
    json<Record<string, any>>("best_model.json"),
    csv<Record<string, any>>("city_metrics.csv"),
    csv<Record<string, any>>("shap/top_features.csv"),
    json<Record<string, any>>("shap/individual_explanation.json"),
  ]);
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (apiBase) {
    const remote = await Promise.all(forecasts.map(async snapshot => {
      try {
        const response = await fetch(`${apiBase}/forecast/${encodeURIComponent(String(snapshot.city))}`, { next: { revalidate: 300 } });
        return response.ok ? await response.json() : snapshot;
      } catch { return snapshot; }
    }));
    const normalized = remote.map((item: any) => item.predicted_aqi_24h ? item : ({
      ...item, model: item.model_info?.name, model_version: item.model_info?.version,
      predicted_aqi_24h: item.forecasts?.["24h"]?.aqi, category_24h: item.forecasts?.["24h"]?.category, forecast_for_24h: item.forecasts?.["24h"]?.timestamp,
      predicted_aqi_48h: item.forecasts?.["48h"]?.aqi, category_48h: item.forecasts?.["48h"]?.category, forecast_for_48h: item.forecasts?.["48h"]?.timestamp,
      predicted_aqi_72h: item.forecasts?.["72h"]?.aqi, category_72h: item.forecasts?.["72h"]?.category, forecast_for_72h: item.forecasts?.["72h"]?.timestamp,
    }));
    return { forecasts: normalized, observations: remote.map((item:any)=>item.latest_observation).filter(Boolean), historical, models, training, quality, leakage, best, cityMetrics, features: features.slice(0,20), individual };
  }
  return { forecasts, observations, historical, models, training, quality, leakage, best, cityMetrics, features: features.slice(0, 20), individual };
}
