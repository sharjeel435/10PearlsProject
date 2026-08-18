from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path


def register_model(model_registry, artifact_dir: Path, name: str, metrics: dict, metadata: dict):
    if not artifact_dir.exists():
        raise FileNotFoundError(artifact_dir)
    model = model_registry.python.create_model(
        name=name, metrics=metrics,
        description=f"Pearls AQI Predictor {metadata.get('model_type', name)} model",
    )
    full_metadata = {**metadata, "training_date": datetime.now(timezone.utc).isoformat(),
                     "forecast_horizons": [24, 48, 72]}
    (artifact_dir / "metadata.json").write_text(json.dumps(full_metadata, indent=2, default=str), encoding="utf-8")
    model.save(str(artifact_dir))
    return model

