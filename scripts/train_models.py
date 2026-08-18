from __future__ import annotations

import argparse
import json
import logging
import random
from pathlib import Path

import joblib
import pandas as pd

from config.settings import SETTINGS
from src.features.feature_engineering import TARGET_COLUMNS
from src.prediction.predictor import write_artifact_digest
from src.training.common import complete_rows
from src.training.evaluation import comparison_row, evaluate_predictions
from src.training.baselines import current_aqi_baseline, seasonal_persistence_baseline
from src.training.leakage_audit import run_leakage_audit
from src.features.quality import audit_features
from src.training.random_forest_trainer import train_random_forest
from src.training.ridge_trainer import train_ridge
from src.training.lstm_trainer import make_sequences, train_lstm
from src.training.split import chronological_split


def train_tabular(frame):
    frame = complete_rows(frame); split = chronological_split(frame); results = []
    for name, trainer in (("aqi_ridge", train_ridge), ("aqi_random_forest", train_random_forest)):
        model, params, elapsed, columns = trainer(split.train, split.validation)
        val_pred = model.predict(split.validation[columns])
        metrics = evaluate_predictions(split.validation[list(TARGET_COLUMNS)], val_pred, split.validation.city)
        results.append((name, model, params, columns, metrics, comparison_row(name, metrics, elapsed)))
    comparison = pd.DataFrame([x[-1] for x in results]).sort_values("overall_rmse")
    return results, comparison, split


def train_all(frame, skip_lstm=False):
    results, comparison, split = train_tabular(frame)
    lstm_result = None
    if not skip_lstm:
        bundle, params, elapsed, columns = train_lstm(split.train, split.validation)
        transformed = split.validation.copy()
        transformed[columns] = bundle["scaler"].transform(bundle["imputer"].transform(transformed[columns]))
        x_val, y_val, cities, _ = make_sequences(transformed, columns, bundle["sequence_length"])
        prediction = bundle["model"].predict(x_val, verbose=0)
        metrics = evaluate_predictions(y_val, prediction, cities)
        row = comparison_row("aqi_lstm", metrics, elapsed)
        comparison = pd.concat([comparison, pd.DataFrame([row])], ignore_index=True).sort_values("overall_rmse")
        lstm_result = ("aqi_lstm", bundle, params, columns, metrics, row)
    return results, lstm_result, comparison, split


def main():
    parser = argparse.ArgumentParser(); parser.add_argument("--input")
    parser.add_argument("--hopsworks", action="store_true", help="Read from aqi_prediction_view v1")
    parser.add_argument("--register", action="store_true", help="Register trained artifacts in Hopsworks")
    parser.add_argument("--skip-lstm", action="store_true", help="Diagnostic tabular-only run")
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO)
    random.seed(42)
    import numpy as np
    np.random.seed(42)
    try:
        import tensorflow as tf
        tf.keras.utils.set_random_seed(42)
    except ImportError:
        pass
    if args.hopsworks:
        from src.feature_store.hopsworks_connection import connect
        project = connect()
        feature_view = project.get_feature_store().get_feature_view("aqi_prediction_view", 1)
        features, labels = feature_view.get_training_data(training_dataset_version=1, event_time=True)
        frame = pd.concat([features.reset_index(drop=True), labels.reset_index(drop=True)], axis=1)
    elif args.input:
        path = Path(args.input)
        frame = pd.read_parquet(path) if path.suffix == ".parquet" else pd.read_csv(path, parse_dates=["timestamp"])
    else:
        parser.error("Provide --hopsworks or --input")
    selected, quality = audit_features(frame)
    keep = ["timestamp", *selected, *TARGET_COLUMNS]
    frame = frame[keep]
    results, lstm_result, comparison, split = train_all(frame, skip_lstm=args.skip_lstm)
    SETTINGS.artifacts_dir.mkdir(parents=True, exist_ok=True)
    baseline_rows = []
    for name, prediction in (("persistence", current_aqi_baseline(split.validation)),
                             ("seasonal_persistence", seasonal_persistence_baseline(split.validation))):
        metrics = evaluate_predictions(split.validation[list(TARGET_COLUMNS)], prediction, split.validation.city)
        baseline_rows.append(comparison_row(name, metrics, 0.0))
    comparison = pd.concat([comparison, pd.DataFrame(baseline_rows)], ignore_index=True).sort_values("overall_rmse")
    for name, model, params, columns, metrics, _ in results:
        output = SETTINGS.artifacts_dir / name; output.mkdir(exist_ok=True)
        model_path = output / "model.joblib"
        joblib.dump({"model": model, "feature_columns": columns}, model_path)
        write_artifact_digest(model_path)
        metrics.to_csv(output / "validation_metrics.csv", index=False)
        (output / "metadata.json").write_text(json.dumps({"hyperparameters": params, "feature_count": len(columns)}, indent=2), encoding="utf-8")
    if lstm_result:
        name, bundle, params, columns, metrics, _ = lstm_result
        output = SETTINGS.artifacts_dir / name; output.mkdir(exist_ok=True)
        bundle["model"].save(output / "model.keras")
        joblib.dump({k: v for k, v in bundle.items() if k != "model"}, output / "preprocessing.joblib")
        metrics.to_csv(output / "validation_metrics.csv", index=False)
        (output / "metadata.json").write_text(json.dumps({"hyperparameters": params, "feature_count": len(columns)}, indent=2), encoding="utf-8")
    comparison.to_csv(SETTINGS.artifacts_dir / "model_comparison.csv", index=False)
    quality.to_csv(SETTINGS.artifacts_dir / "feature_quality_report.csv", index=False)
    leakage = run_leakage_audit(frame, selected, split)
    (SETTINGS.artifacts_dir / "leakage_report.json").write_text(json.dumps(leakage, indent=2), encoding="utf-8")
    all_city_metrics = []
    for name, model, _, columns, _, _ in results:
        prediction = model.predict(split.test[columns])
        metrics = evaluate_predictions(split.test[list(TARGET_COLUMNS)], prediction, split.test.city)
        metrics.insert(0, "model", name); all_city_metrics.append(metrics)
    # Also store LSTM test metrics if available
    if lstm_result:
        name, bundle, _, columns, _, _ = lstm_result
        transformed_test = split.test.copy()
        transformed_test[columns] = bundle["scaler"].transform(bundle["imputer"].transform(transformed_test[columns]))
        x_test, y_test, cities_test, _ = make_sequences(transformed_test, columns, bundle["sequence_length"])
        if len(x_test):
            lstm_test_pred = bundle["model"].predict(x_test, verbose=0)
            lstm_test_metrics = evaluate_predictions(y_test, lstm_test_pred, cities_test)
            lstm_test_metrics.insert(0, "model", name)
            all_city_metrics.append(lstm_test_metrics)
            lstm_test_metrics.to_csv(SETTINGS.artifacts_dir / "aqi_lstm" / "test_metrics.csv", index=False)
    # Baseline test metrics
    baseline_test_rows = []
    for bname, bpred in (("persistence", current_aqi_baseline(split.test)),
                          ("seasonal_persistence", seasonal_persistence_baseline(split.test))):
        bm = evaluate_predictions(split.test[list(TARGET_COLUMNS)], bpred, split.test.city)
        bm.insert(0, "model", bname)
        baseline_test_rows.append(bm)
    if baseline_test_rows:
        pd.concat(baseline_test_rows).to_csv(SETTINGS.artifacts_dir / "baseline_test_metrics.csv", index=False)
    if all_city_metrics:
        pd.concat(all_city_metrics).to_csv(SETTINGS.artifacts_dir / "city_metrics.csv", index=False)
    # Build best_model.json with explicit validation vs test separation
    best_ml = comparison[comparison.model.str.startswith("aqi_")].iloc[0]
    best_name = best_ml["model"]
    # Find validation metrics for best model
    best_val_entry = next((r[-1] for r in results if r[0] == best_name), None)
    # Find test metrics for best model from city_metrics (overall rows)
    best_test_df = pd.concat(all_city_metrics) if all_city_metrics else pd.DataFrame()
    best_test_overall = best_test_df[
        (best_test_df["model"] == best_name) & (best_test_df["city"] == "overall")
    ] if not best_test_df.empty else pd.DataFrame()
    val_metrics = {
        "overall_rmse": best_ml["overall_rmse"],
        "mae": best_ml["mae"],
        "r2": best_ml["r2"],
        "24h_rmse": best_ml["24h_rmse"],
        "48h_rmse": best_ml["48h_rmse"],
        "72h_rmse": best_ml["72h_rmse"],
    } if best_val_entry else {"overall_rmse": best_ml["overall_rmse"], "mae": best_ml["mae"], "r2": best_ml["r2"]}
    test_metrics: dict = {}
    if not best_test_overall.empty:
        test_metrics = {
            f"{int(h)}h_rmse": float(best_test_overall.loc[best_test_overall["horizon"] == h, "rmse"].iloc[0])
            for h in (24, 48, 72) if not best_test_overall.loc[best_test_overall["horizon"] == h].empty
        }
        test_metrics["overall_rmse"] = float(best_test_overall["rmse"].mean())
        test_metrics["mae"] = float(best_test_overall["mae"].mean())
        test_metrics["r2"] = float(best_test_overall["r2"].mean())
        test_metrics["r2_24h"] = float(best_test_overall.loc[best_test_overall["horizon"] == 24, "r2"].iloc[0]) if not best_test_overall.loc[best_test_overall["horizon"] == 24].empty else None
        test_metrics["r2_48h"] = float(best_test_overall.loc[best_test_overall["horizon"] == 48, "r2"].iloc[0]) if not best_test_overall.loc[best_test_overall["horizon"] == 48].empty else None
        test_metrics["r2_72h"] = float(best_test_overall.loc[best_test_overall["horizon"] == 72, "r2"].iloc[0]) if not best_test_overall.loc[best_test_overall["horizon"] == 72].empty else None
    best_model_doc = {
        "model": best_name,
        "model_selection_split": "validation",
        "validation_metrics": val_metrics,
        "final_test_metrics": test_metrics,
        # Legacy flat fields kept for backward compatibility
        "24h_rmse": best_ml["24h_rmse"],
        "48h_rmse": best_ml["48h_rmse"],
        "72h_rmse": best_ml["72h_rmse"],
        "overall_rmse": best_ml["overall_rmse"],
        "mae": best_ml["mae"],
        "r2": best_ml["r2"],
        "training_time_seconds": best_ml["training_time_seconds"],
    }
    (SETTINGS.artifacts_dir / "best_model.json").write_text(
        json.dumps(best_model_doc, indent=2), encoding="utf-8"
    )
    if args.register:
        if not args.hopsworks:
            parser.error("--register requires --hopsworks so registry lineage is explicit")
        from src.training.model_registry import register_model
        registry = project.get_model_registry()
        for name, _, params, columns, metrics, row in results:
            register_model(
                registry,
                SETTINGS.artifacts_dir / name,
                name,
                {"rmse": row["overall_rmse"], "mae": row["mae"], "r2": row["r2"]},
                {"model_type": name, "hyperparameters": params, "feature_count": len(columns),
                 "feature_view": "aqi_prediction_view_v1", "training_dataset_version": 1},
            )
        if lstm_result:
            name, _, params, columns, _, row = lstm_result
            register_model(
                registry,
                SETTINGS.artifacts_dir / name,
                name,
                {"rmse": row["overall_rmse"], "mae": row["mae"], "r2": row["r2"]},
                {"model_type": name, "hyperparameters": params, "feature_count": len(columns),
                 "feature_view": "aqi_prediction_view_v1", "training_dataset_version": 1},
            )
    print(comparison.to_string(index=False)); print(f"Best validation model: {comparison.iloc[0].model}")


if __name__ == "__main__": main()
