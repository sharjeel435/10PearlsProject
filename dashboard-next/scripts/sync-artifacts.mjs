import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const frontend = path.resolve(here, "..");
const source = path.resolve(frontend, "..", "artifacts");
const target = path.join(frontend, "data");

const files = [
  "latest_forecasts.json",
  "latest_observations.json",
  "historical_daily_30d.json",
  "model_comparison.csv",
  "training_summary.json",
  "data_quality_report.json",
  "leakage_report.json",
  "best_model.json",
  "city_metrics.csv",
  "shap/top_features.csv",
  "shap/individual_explanation.json",
];

for (const file of files) {
  const destination = path.join(target, file);
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(path.join(source, file), destination);
}

console.log(`Synced ${files.length} verified presentation artifacts.`);
