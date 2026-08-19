"""SHAP explainability for tree-based models.

Supports Random Forest (sklearn Pipeline) and HistGradientBoosting
(Pipeline with MultiOutputRegressor).  Falls back gracefully when
SHAP is not installed.
"""
from __future__ import annotations

import json
from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd


def _get_shap():
    try:
        import shap
        return shap
    except ImportError as exc:
        raise RuntimeError("Install the 'explain' extra for SHAP analysis") from exc


def _extract_preprocessed(pipeline, sample: pd.DataFrame):
    """Return (transformed_array, feature_names) from a sklearn Pipeline."""
    transformed = pipeline.named_steps["preprocessor"].transform(sample)
    names = list(pipeline.named_steps["preprocessor"].get_feature_names_out())
    return transformed, names


def _explain_tree_pipeline(pipeline, transformed, names, output_dir: Path, label: str):
    """Core SHAP logic shared by RF and HGBT."""
    shap = _get_shap()
    output_dir.mkdir(parents=True, exist_ok=True)
    horizons = ["24h", "48h", "72h"]

    # HGBT wraps a MultiOutputRegressor — unwrap to underlying estimators
    inner = pipeline.named_steps["model"]
    if hasattr(inner, "estimators_"):
        # MultiOutputRegressor
        all_importance = []
        for i, (horizon, est) in enumerate(zip(horizons, inner.estimators_)):
            explainer = shap.TreeExplainer(est)
            values = explainer(transformed)
            shap.summary_plot(values, transformed, feature_names=names, show=False, max_display=25)
            plt.tight_layout()
            plt.savefig(output_dir / f"{label}_shap_{horizon}.png", dpi=160)
            plt.close()
            importance = pd.DataFrame({
                "feature": names,
                f"mean_abs_shap_{horizon}": abs(values.values).mean(axis=0),
            })
            all_importance.append(importance.set_index("feature"))
        combined = pd.concat(all_importance, axis=1)
    else:
        # Single multi-output estimator (e.g. RandomForest)
        explainer = shap.TreeExplainer(inner)
        values = explainer(transformed)
        all_importance = []
        for i, horizon in enumerate(horizons):
            shap.summary_plot(values[..., i], transformed, feature_names=names, show=False, max_display=25)
            plt.tight_layout()
            plt.savefig(output_dir / f"{label}_shap_{horizon}.png", dpi=160)
            plt.close()
            importance = pd.DataFrame({
                "feature": names,
                f"mean_abs_shap_{horizon}": abs(values.values[..., i]).mean(axis=0),
            })
            all_importance.append(importance.set_index("feature"))
        combined = pd.concat(all_importance, axis=1)

    combined.to_csv(output_dir / "top_features.csv")

    # Individual explanation for the first sample at 24h horizon
    first_row_shap = combined["mean_abs_shap_24h"].sort_values(ascending=False)
    explanation = {
        "model": label,
        "prediction_output": "24h",
        "top_contributors": [
            {"feature": feat, "mean_abs_shap_24h": float(val)}
            for feat, val in first_row_shap.head(20).items()
        ],
    }
    (output_dir / "individual_explanation.json").write_text(
        json.dumps(explanation, indent=2), encoding="utf-8"
    )
    return combined.sort_values("mean_abs_shap_24h", ascending=False)


def explain_random_forest(pipeline, sample: pd.DataFrame, output_dir: Path, max_rows: int = 1000):
    transformed, names = _extract_preprocessed(pipeline, sample.iloc[:max_rows])
    return _explain_tree_pipeline(pipeline, transformed, names, output_dir, label="random_forest")


def explain_hgbt(pipeline, sample: pd.DataFrame, output_dir: Path, max_rows: int = 1000):
    """SHAP explanation for HistGradientBoosting + MultiOutputRegressor pipeline."""
    transformed, names = _extract_preprocessed(pipeline, sample.iloc[:max_rows])
    return _explain_tree_pipeline(pipeline, transformed, names, output_dir, label="hgbt")
