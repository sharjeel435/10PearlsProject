from __future__ import annotations

import hashlib
import json
import joblib
import pandas as pd
from pathlib import Path

from config.settings import SETTINGS, TARGET_HORIZONS


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def load_sklearn_bundle(path, expected_sha256: str | None = None):
    model_path = Path(path).resolve(strict=True)
    trusted_root = SETTINGS.artifacts_dir.resolve()
    if trusted_root not in model_path.parents:
        raise ValueError(f"Model must be located under the trusted artifacts directory: {trusted_root}")
    digest_file = model_path.with_suffix(model_path.suffix + ".sha256")
    digest = expected_sha256
    if digest is None and digest_file.exists():
        digest = digest_file.read_text(encoding="ascii").strip()
    if not digest:
        raise ValueError("Model digest is required before loading an executable joblib artifact")
    actual = file_sha256(model_path)
    if actual.lower() != digest.lower():
        raise ValueError("Model artifact integrity verification failed")
    return joblib.load(model_path)


def write_artifact_digest(path: Path) -> str:
    digest = file_sha256(path)
    path.with_suffix(path.suffix + ".sha256").write_text(digest + "\n", encoding="ascii")
    return digest


def predict_latest(model, feature_columns: list[str], frame: pd.DataFrame) -> pd.DataFrame:
    latest = frame.sort_values("timestamp").groupby("city", as_index=False).tail(1)
    predictions = model.predict(latest[feature_columns])
    rows = []
    for row_index, (_, observation) in enumerate(latest.iterrows()):
        for output_index, horizon in enumerate(TARGET_HORIZONS):
            rows.append({"city": observation.city, "issued_at": observation.timestamp,
                         "horizon_hours": horizon, "forecast_timestamp": observation.timestamp + pd.Timedelta(hours=horizon),
                         "predicted_us_aqi": max(0.0, float(predictions[row_index, output_index]))})
    return pd.DataFrame(rows)
