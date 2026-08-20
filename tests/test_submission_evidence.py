import json
from pathlib import Path

import pandas as pd
import pytest


ARTIFACTS = Path("artifacts")


def test_training_summary_records_leakage_safe_boundaries():
    summary = json.loads((ARTIFACTS / "training_summary.json").read_text(encoding="utf-8"))
    assert summary["split_purge_hours"] == 72
    assert summary["model_selection_split"] == "validation"
    assert summary["final_evaluation_split"] == "test"
    train_end = pd.Timestamp(summary["train"]["end"])
    validation_start = pd.Timestamp(summary["validation"]["start"])
    validation_end = pd.Timestamp(summary["validation"]["end"])
    test_start = pd.Timestamp(summary["test"]["start"])
    assert train_end + pd.Timedelta(hours=72) < validation_start
    assert validation_end + pd.Timedelta(hours=72) < test_start
    assert set(summary["leakage"].values()) == {"PASS"}


def test_best_model_test_aggregates_match_city_metrics():
    best = json.loads((ARTIFACTS / "best_model.json").read_text(encoding="utf-8"))
    rows = pd.read_csv(ARTIFACTS / "city_metrics.csv")
    overall = rows[(rows.model == best["model"]) & (rows.city == "overall")]
    metrics = best["final_test_metrics"]
    assert metrics["overall_rmse"] == pytest.approx(overall.rmse.mean())
    assert metrics["mae"] == pytest.approx(overall.mae.mean())
    assert metrics["r2"] == pytest.approx(overall.r2.mean())
    for horizon in (24, 48, 72):
        row = overall[overall.horizon == horizon].iloc[0]
        assert metrics[f"{horizon}h_rmse"] == pytest.approx(row.rmse)
        assert metrics[f"r2_{horizon}h"] == pytest.approx(row.r2)


def test_shap_covers_every_horizon_and_has_real_local_values():
    importance = pd.read_csv(ARTIFACTS / "shap" / "top_features.csv")
    assert {
        "mean_abs_shap_24h",
        "mean_abs_shap_48h",
        "mean_abs_shap_72h",
    } <= set(importance.columns)
    for horizon in (24, 48, 72):
        plot = ARTIFACTS / "shap" / f"random_forest_shap_{horizon}h.png"
        assert plot.stat().st_size > 10_000
    local = json.loads(
        (ARTIFACTS / "shap" / "individual_explanation.json").read_text(encoding="utf-8")
    )
    assert isinstance(local["prediction"], float)
    assert local["top_contributors"]
    assert {"feature", "feature_value", "shap_value"} <= set(local["top_contributors"][0])
