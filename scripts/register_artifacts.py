"""
Register already-trained local artifacts with the Hopsworks Model Registry.

Usage (called by CI after train_models.py has written artifacts to disk):
    python -m scripts.register_artifacts

This script is intentionally separate from train_models.py so that:
  - Training can run reliably from Open-Meteo data (no Hopsworks dependency).
  - Registration is a non-blocking optional step that can fail without
    invalidating the trained artifacts.

The script is idempotent: re-running it creates a new versioned entry in
the Hopsworks registry but does not overwrite the local artifacts.
"""
from __future__ import annotations

import json
import logging
import sys
from pathlib import Path

import pandas as pd

from config.settings import SETTINGS
from src.feature_store.hopsworks_connection import connect
from src.training.model_registry import register_model

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
LOG = logging.getLogger(__name__)


def _load_comparison() -> pd.DataFrame:
    path = SETTINGS.artifacts_dir / "model_comparison.csv"
    if not path.exists():
        raise FileNotFoundError(f"model_comparison.csv not found at {path}. Run train_models.py first.")
    return pd.read_csv(path)


def main() -> None:
    comparison = _load_comparison()
    LOG.info("Connecting to Hopsworks project …")
    project = connect()
    registry = project.get_model_registry()

    registered = 0
    for name in ("aqi_random_forest", "aqi_ridge", "aqi_lstm"):
        artifact_dir = SETTINGS.artifacts_dir / name
        if not artifact_dir.exists():
            LOG.warning("Artifact directory missing for %s — skipping", name)
            continue

        row = comparison[comparison["model"] == name]
        if row.empty:
            LOG.warning("No comparison row for %s — skipping", name)
            continue

        metrics = {
            "rmse":  float(row["overall_rmse"].iloc[0]),
            "mae":   float(row["mae"].iloc[0]),
            "r2":    float(row["r2"].iloc[0]),
            "24h_rmse": float(row["24h_rmse"].iloc[0]),
            "48h_rmse": float(row["48h_rmse"].iloc[0]),
            "72h_rmse": float(row["72h_rmse"].iloc[0]),
        }

        meta_path = artifact_dir / "metadata.json"
        metadata = json.loads(meta_path.read_text(encoding="utf-8")) if meta_path.exists() else {}
        metadata.update({
            "model_type": name,
            "source": "open-meteo-archive",
            "forecast_horizons": [24, 48, 72],
        })

        LOG.info("Registering %s  (rmse=%.3f, r2=%.3f) …", name, metrics["rmse"], metrics["r2"])
        try:
            register_model(registry, artifact_dir, name, metrics, metadata)
            LOG.info("✅  Registered %s", name)
            registered += 1
        except Exception as exc:
            LOG.error("Failed to register %s: %s", name, exc)

    if registered == 0:
        LOG.error("No models were registered. Check Hopsworks connectivity and artifact paths.")
        sys.exit(1)

    LOG.info("Done — %d model(s) registered in Hopsworks Model Registry.", registered)


if __name__ == "__main__":
    main()
