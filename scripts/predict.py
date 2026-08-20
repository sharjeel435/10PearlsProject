import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

from config.settings import SETTINGS
from scripts.run_feature_pipeline import incremental_frame
from src.model_serving.model_loader import MODEL_LOADER
from src.prediction.categories import aqi_category
from src.prediction.predictor import load_sklearn_bundle, predict_latest


def build_forecast_rows(long: pd.DataFrame, model_name: str, model_version: int) -> list[dict]:
    rows = []
    for city, group in long.groupby("city"):
        values = {int(row.horizon_hours): row for row in group.itertuples()}
        item = {
            "city": city,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "model": model_name,
            "model_version": model_version,
        }
        for horizon in (24, 48, 72):
            item[f"forecast_for_{horizon}h"] = values[horizon].forecast_timestamp.isoformat()
            item[f"predicted_aqi_{horizon}h"] = values[horizon].predicted_us_aqi
            item[f"category_{horizon}h"] = aqi_category(values[horizon].predicted_us_aqi)
        rows.append(item)
    return rows


def main():
    parser = argparse.ArgumentParser(); parser.add_argument("--model"); parser.add_argument("--features")
    parser.add_argument("--latest", action="store_true"); args = parser.parse_args()
    if args.latest:
        loaded = MODEL_LOADER.load()
        bundle, model_name, model_version = loaded.bundle, loaded.name, loaded.version
        frame = incremental_frame()
    else:
        if not args.model or not args.features: parser.error("Provide --latest or both --model and --features")
        model_path, model_name = Path(args.model), Path(args.model).parent.name
        frame = pd.read_parquet(args.features)
        bundle = load_sklearn_bundle(model_path)
        model_version = SETTINGS.model_version
    long = predict_latest(bundle["model"], bundle["feature_columns"], frame)
    rows = build_forecast_rows(long, model_name, model_version)
    SETTINGS.artifacts_dir.mkdir(parents=True, exist_ok=True)
    (SETTINGS.artifacts_dir / "latest_forecasts.json").write_text(json.dumps(rows, indent=2), encoding="utf-8")
    print(pd.DataFrame(rows).to_string(index=False))


if __name__ == "__main__": main()
