from __future__ import annotations

import os
from dataclasses import dataclass, field
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

WEATHER_VARIABLES = (
    "temperature_2m", "relative_humidity_2m", "dew_point_2m",
    "apparent_temperature", "precipitation", "rain", "surface_pressure",
    "cloud_cover", "wind_speed_10m", "wind_direction_10m", "wind_gusts_10m",
)
AIR_QUALITY_VARIABLES = (
    "pm10", "pm2_5", "carbon_monoxide", "nitrogen_dioxide",
    "sulphur_dioxide", "ozone", "us_aqi",
)
TARGET_HORIZONS = (24, 48, 72)
AQI_LAGS = (1, 2, 3, 4, 6, 8, 12, 18, 24, 36, 48, 72, 168)
POLLUTANT_LAGS = (1, 3, 6, 12, 24, 48, 72)
WEATHER_LAGS = (1, 3, 6, 12, 24)
ROLLING_WINDOWS = (3, 6, 12, 24, 48, 72, 168)
EPISODE_THRESHOLDS = {
    "pm2_5": 35.0, "pm10": 100.0, "nitrogen_dioxide": 100.0,
    "ozone": 100.0, "aqi_100": 100.0, "aqi_150": 150.0, "aqi_200": 200.0,
}


def _model_version() -> int | None:
    value = os.getenv("MODEL_VERSION", "1").strip().lower()
    return None if value == "latest" else int(value)


@dataclass(frozen=True)
class Settings:
    historical_start: date = date(2022, 8, 1)
    historical_end: date = field(default_factory=lambda: date.today() - timedelta(days=5))
    request_chunk_days: int = 90
    request_timeout_seconds: int = 45
    request_retries: int = 4
    feature_group_name: str = "aqi_features"
    feature_group_version: int = 1
    feature_view_name: str = "aqi_prediction_view"
    feature_view_version: int = 1
    hopsworks_project: str = field(default_factory=lambda: os.getenv("HOPSWORKS_PROJECT", "DataProject"))
    model_name: str = field(default_factory=lambda: os.getenv("MODEL_NAME", "aqi_random_forest"))
    # "latest" is used by the post-training forecast job. Serving deployments
    # remain pinned by default for reproducibility and straightforward rollback.
    model_version: int | None = field(default_factory=_model_version)
    model_sha256: str | None = field(default_factory=lambda: os.getenv("MODEL_SHA256") or None)
    model_cache_dir: Path = field(default_factory=lambda: Path(os.getenv("MODEL_CACHE_DIR", str(ROOT / ".model-cache"))))
    artifacts_dir: Path = ROOT / "artifacts"
    raw_dir: Path = ROOT / "data" / "raw"
    processed_dir: Path = ROOT / "data" / "processed"


SETTINGS = Settings()
