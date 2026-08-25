import fs from "node:fs/promises";
import path from "node:path";
import Papa from "papaparse";
import { loadWeatherOutlooks } from "./openmeteo";
import { loadLiveInsights } from "./live-insights";

// ─── Architecture note ────────────────────────────────────────────────────────
// This platform uses a static-first ML serving pattern:
//   GitHub Actions (daily) → scripts/predict.py + scripts/refresh_observations.py
//   → artifacts/*.json  → dashboard-next/data/ (via sync-artifacts.mjs)
//   → git commit → Vercel auto-redeploy
//
// All forecast and observation data is served as pre-built static JSON.
// No live API server is required or used.
// ─────────────────────────────────────────────────────────────────────────────

const artifact = (name: string) => path.join(process.cwd(), "data", name);

/** Read a JSON artifact — returns `fallback` if the file is missing. */
async function json<T>(name: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(artifact(name), "utf8")) as T;
  } catch {
    return fallback;
  }
}

/** Read a CSV artifact — returns `[]` if the file is missing. */
async function csv<T>(name: string): Promise<T[]> {
  try {
    const parsed = Papa.parse<T>(await fs.readFile(artifact(name), "utf8"), {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    });
    return parsed.data;
  } catch {
    return [];
  }
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
  const [
    forecasts,
    observations,
    historical,
    models,
    training,
    quality,
    leakage,
    best,
    cityMetrics,
    features,
    individual,
    weatherOutlooks,
    ruleBasedInsights,
  ] = await Promise.all([
    json<Forecast[]>("latest_forecasts.json", []),
    json<Record<string, any>[]>("latest_observations.json", []),
    json<Record<string, any>[]>("historical_daily_30d.json", []),
    csv<ModelMetric>("model_comparison.csv"),
    json<Record<string, any>>("training_summary.json", {}),
    json<Record<string, any>>("data_quality_report.json", {}),
    json<Record<string, string>>("leakage_report.json", {}),
    json<Record<string, any>>("best_model.json", {}),
    csv<Record<string, any>>("city_metrics.csv"),
    csv<Record<string, any>>("shap/top_features.csv"),
    json<Record<string, any>>("shap/individual_explanation.json", {}),
    loadWeatherOutlooks(),
    loadLiveInsights(),
  ]);

  return {
    forecasts,
    observations,
    historical,
    models,
    training,
    quality,
    leakage,
    best,
    cityMetrics,
    features: features.slice(0, 20),
    individual,
    weatherOutlooks,
    ruleBasedInsights,
  };
}
