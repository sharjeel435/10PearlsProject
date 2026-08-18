from __future__ import annotations

import hashlib
import json
import logging
import time
from datetime import date, timedelta
from pathlib import Path
from typing import Iterable

import pandas as pd
import requests

from config.settings import SETTINGS

LOG = logging.getLogger(__name__)


class OpenMeteoError(RuntimeError):
    pass


class OpenMeteoClient:
    WEATHER_ARCHIVE = "https://archive-api.open-meteo.com/v1/archive"
    WEATHER_FORECAST = "https://api.open-meteo.com/v1/forecast"
    AIR_QUALITY = "https://air-quality-api.open-meteo.com/v1/air-quality"

    def __init__(self, cache_dir: Path | None = None, session: requests.Session | None = None):
        self.session = session or requests.Session()
        self.cache_dir = cache_dir or SETTINGS.raw_dir / "cache"
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def _request(self, endpoint: str, params: dict, use_cache: bool = True) -> dict:
        key = hashlib.sha256(json.dumps([endpoint, params], sort_keys=True).encode()).hexdigest()
        cache_file = self.cache_dir / f"{key}.json"
        if use_cache and cache_file.exists():
            return json.loads(cache_file.read_text(encoding="utf-8"))
        last_error: Exception | None = None
        for attempt in range(SETTINGS.request_retries):
            try:
                response = self.session.get(endpoint, params=params, timeout=SETTINGS.request_timeout_seconds)
                response.raise_for_status()
                payload = response.json()
                if payload.get("error"):
                    raise OpenMeteoError(str(payload.get("reason", "Open-Meteo error")))
                if "hourly" not in payload or "time" not in payload["hourly"]:
                    raise OpenMeteoError("Open-Meteo response has no hourly observations")
                if use_cache:
                    cache_file.write_text(json.dumps(payload), encoding="utf-8")
                return payload
            except (requests.RequestException, ValueError, OpenMeteoError) as exc:
                last_error = exc
                if attempt + 1 < SETTINGS.request_retries:
                    time.sleep(min(2**attempt, 8))
        raise OpenMeteoError(f"Open-Meteo request failed after retries: {last_error}") from last_error

    @staticmethod
    def _frame(payload: dict, city: str, latitude: float, longitude: float) -> pd.DataFrame:
        frame = pd.DataFrame(payload["hourly"])
        frame["timestamp"] = pd.to_datetime(frame.pop("time"), utc=True, errors="raise")
        frame.insert(0, "city", city)
        frame.insert(1, "latitude", latitude)
        frame.insert(2, "longitude", longitude)
        return frame

    @staticmethod
    def chunks(start: date, end: date, days: int) -> Iterable[tuple[date, date]]:
        cursor = start
        while cursor <= end:
            chunk_end = min(cursor + timedelta(days=days - 1), end)
            yield cursor, chunk_end
            cursor = chunk_end + timedelta(days=1)

    def fetch_historical(self, city, start: date, end: date, variables: tuple[str, ...], kind: str) -> pd.DataFrame:
        endpoint = self.WEATHER_ARCHIVE if kind == "weather" else self.AIR_QUALITY
        frames = []
        for chunk_start, chunk_end in self.chunks(start, end, SETTINGS.request_chunk_days):
            LOG.info("Fetching %s for %s: %s to %s", kind, city.name, chunk_start, chunk_end)
            params = {
                "latitude": city.latitude, "longitude": city.longitude,
                "start_date": chunk_start.isoformat(), "end_date": chunk_end.isoformat(),
                "hourly": ",".join(variables), "timezone": "UTC",
            }
            frames.append(self._frame(self._request(endpoint, params), city.name, city.latitude, city.longitude))
        result = pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()
        LOG.info("Downloaded %d %s rows for %s", len(result), kind, city.name)
        return result

    def fetch_forecast(self, city, variables: tuple[str, ...], kind: str, days: int = 4) -> pd.DataFrame:
        endpoint = self.WEATHER_FORECAST if kind == "weather" else self.AIR_QUALITY
        params = {"latitude": city.latitude, "longitude": city.longitude,
                  "hourly": ",".join(variables), "forecast_days": days, "timezone": "UTC"}
        return self._frame(self._request(endpoint, params, use_cache=False), city.name, city.latitude, city.longitude)
