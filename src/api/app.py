from __future__ import annotations
import json, logging, os
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from config.cities import CITIES
from config.settings import SETTINGS
from src.model_serving.model_loader import MODEL_LOADER

LOG = logging.getLogger(__name__)

def parse_allowed_origins(value: str | None) -> list[str]:
    origins = []
    for raw in (value or "http://localhost:3000").split(","):
        origin = raw.strip().rstrip("/")
        if origin and origin != "*" and origin not in origins: origins.append(origin)
    return origins

@asynccontextmanager
async def lifespan(_: FastAPI):
    logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO").upper())
    LOG.info("Starting Pearls AQI API")
    if os.getenv("LOAD_MODEL_ON_STARTUP", "1") == "1": MODEL_LOADER.load()
    yield

app = FastAPI(title="Pearls AQI Predictor", version="1.1.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware,
    allow_origins=parse_allowed_origins(os.getenv("ALLOWED_ORIGINS") or os.getenv("CORS_ORIGINS")),
    allow_origin_regex=os.getenv("ALLOWED_ORIGIN_REGEX") or None,
    allow_methods=["GET"], allow_headers=["Accept", "Content-Type"])

def _artifact(name: str) -> Path: return SETTINGS.artifacts_dir / name
def _load_json(name: str):
    path = _artifact(name)
    if not path.exists(): raise HTTPException(503, f"Required {name} artifact is unavailable")
    return json.loads(path.read_text(encoding="utf-8"))

@app.get("/health")
def health():
    ready = MODEL_LOADER.ready
    forecast_ready = _artifact("latest_forecasts.json").exists()
    return {"status": "ok" if (ready or forecast_ready) else "degraded", "model_ready": ready,
            "forecast_ready": forecast_ready}

@app.get("/cities")
def cities(): return [city.name for city in CITIES]

@app.get("/forecast/{city}")
def forecast(city: str):
    canonical = {x.name.lower(): x.name for x in CITIES}.get(city.lower())
    if not canonical: raise HTTPException(404, f"Unsupported city: {city}")
    item = next((x for x in _load_json("latest_forecasts.json") if x["city"] == canonical), None)
    if not item: raise HTTPException(404, f"No forecast available for {canonical}")
    observation = next((x for x in _load_json("latest_observations.json") if x["city"] == canonical), None)
    return {**item, "data_status": "cached", "latest_observation": observation,
            "forecasts": {f"{h}h": {"aqi": item[f"predicted_aqi_{h}h"], "category": item[f"category_{h}h"],
            "timestamp": item[f"forecast_for_{h}h"]} for h in (24, 48, 72)},
            "model_info": {"name": item["model"], "version": item["model_version"]}}

@app.get("/model-info")
def model_info():
    data = _load_json("best_model.json")
    return {"model": data.get("model"), "model_version": SETTINGS.model_version,
            "model_selection_split": data.get("model_selection_split", "validation"),
            "model_selection_note": "Selected on validation RMSE; final test was held out.",
            "validation_metrics": data.get("validation_metrics", {}),
            "final_test_metrics": data.get("final_test_metrics", {}),
            "training_time_seconds": data.get("training_time_seconds")}
