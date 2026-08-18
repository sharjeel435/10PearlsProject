import { copyFile, mkdir, access } from "node:fs/promises";
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

let synced = 0;
for (const file of files) {
  const src = path.join(source, file);
  const destination = path.join(target, file);
  try {
    await access(src);
    await mkdir(path.dirname(destination), { recursive: true });
    await copyFile(src, destination);
    synced++;
  } catch {
    console.warn(`⚠️  Skipping missing artifact: ${file}`);
  }
}

console.log(`✅ Synced ${synced}/${files.length} presentation artifacts.`);

