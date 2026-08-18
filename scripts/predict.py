import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

from config.settings import SETTINGS
from scripts.run_feature_pipeline import incremental_frame
from src.prediction.categories import aqi_category
from src.prediction.predictor import load_sklearn_bundle, predict_latest


def main():
    parser = argparse.ArgumentParser(); parser.add_argument("--model"); parser.add_argument("--features")
    parser.add_argument("--latest", action="store_true"); args = parser.parse_args()
    if args.latest:
        best_path = SETTINGS.artifacts_dir / "best_model.json"
        if not best_path.exists(): raise FileNotFoundError("Run model training before latest prediction")
        best = json.loads(best_path.read_text(encoding="utf-8")); model_name = best["model"]
        model_path = SETTINGS.artifacts_dir / model_name / "model.joblib"
        frame = incremental_frame()
    else:
        if not args.model or not args.features: parser.error("Provide --latest or both --model and --features")
        model_path, model_name = Path(args.model), Path(args.model).parent.name
        frame = pd.read_parquet(args.features)
    bundle = load_sklearn_bundle(model_path)
    long = predict_latest(bundle["model"], bundle["feature_columns"], frame)
    rows = []
    for city, group in long.groupby("city"):
        values = {int(row.horizon_hours): row for row in group.itertuples()}
        item = {"city": city, "generated_at": datetime.now(timezone.utc).isoformat(),
                "model": model_name, "model_version": 1}
        for horizon in (24, 48, 72):
            item[f"forecast_for_{horizon}h"] = values[horizon].forecast_timestamp.isoformat()
            item[f"predicted_aqi_{horizon}h"] = values[horizon].predicted_us_aqi
            item[f"category_{horizon}h"] = aqi_category(values[horizon].predicted_us_aqi)
        rows.append(item)
    SETTINGS.artifacts_dir.mkdir(parents=True, exist_ok=True)
    (SETTINGS.artifacts_dir / "latest_forecasts.json").write_text(json.dumps(rows, indent=2), encoding="utf-8")
    print(pd.DataFrame(rows).to_string(index=False))


if __name__ == "__main__": main()
