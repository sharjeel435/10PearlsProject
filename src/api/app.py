from __future__ import annotations

import json
import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from config.cities import CITIES
from config.settings import SETTINGS

app = FastAPI(title="Pearls AQI Predictor", version="1.0.0")
allowed_origins = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if origin.strip()]
app.add_middleware(CORSMiddleware, allow_origins=allowed_origins, allow_methods=["GET"], allow_headers=["*"])


def _forecast_path() -> Path:
    return SETTINGS.artifacts_dir / "latest_forecasts.json"


def _load_forecasts() -> list[dict]:
    path = _forecast_path()
    if not path.exists():
        raise HTTPException(503, "Forecast artifact is not available; run scripts.predict first")
    return json.loads(path.read_text(encoding="utf-8"))


def _latest_observation(city: str) -> dict | None:
    path = SETTINGS.artifacts_dir / "latest_observations.json"
    if not path.exists():
        return None
    return next((item for item in json.loads(path.read_text(encoding="utf-8")) if item["city"] == city), None)


@app.get("/health")
def health():
    return {"status": "ok", "forecast_ready": _forecast_path().exists()}


@app.get("/cities")
def cities():
    return [city.name for city in CITIES]


@app.get("/forecast/{city}")
def forecast(city: str):
    supported = {x.name.lower(): x.name for x in CITIES}
    canonical = supported.get(city.lower())
    if not canonical:
        raise HTTPException(404, f"Unsupported city: {city}")
    for item in _load_forecasts():
        if item["city"] == canonical:
            return {
                **item,
                "latest_observation": _latest_observation(canonical),
                "forecasts": {f"{h}h": {"aqi": item[f"predicted_aqi_{h}h"], "category": item[f"category_{h}h"], "timestamp": item[f"forecast_for_{h}h"]} for h in (24, 48, 72)},
                "model_info": {"name": item["model"], "version": item["model_version"]},
            }
    raise HTTPException(404, f"No forecast available for {canonical}")


@app.get("/model-info")
def model_info():
    path = SETTINGS.artifacts_dir / "best_model.json"
    if not path.exists():
        raise HTTPException(503, "Best-model metadata is unavailable")
    data = json.loads(path.read_text(encoding="utf-8"))
    # Ensure the response always exposes labelled sections even for legacy artifacts
    response = {
        "model": data.get("model"),
        "model_selection_split": data.get("model_selection_split", "validation"),
        "model_selection_note": (
            "Model was selected based on lowest overall RMSE on the validation set. "
            "final_test_metrics were computed on the held-out chronological test set "
            "which was never used for model selection or hyperparameter tuning."
        ),
        "validation_metrics": data.get("validation_metrics", {
            "overall_rmse": data.get("overall_rmse"),
            "mae": data.get("mae"),
            "r2": data.get("r2"),
            "24h_rmse": data.get("24h_rmse"),
            "48h_rmse": data.get("48h_rmse"),
            "72h_rmse": data.get("72h_rmse"),
        }),
        "final_test_metrics": data.get("final_test_metrics", {}),
        "training_time_seconds": data.get("training_time_seconds"),
    }
    return response
