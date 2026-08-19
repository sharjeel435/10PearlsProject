from __future__ import annotations

import argparse
import logging
from datetime import date, timedelta

import pandas as pd

from config.cities import CITIES
from config.settings import AIR_QUALITY_VARIABLES, SETTINGS, WEATHER_VARIABLES
from src.data.cleaner import clean_observations, merge_weather_air_quality
from src.data.openmeteo_client import OpenMeteoClient
from src.data.validator import validate_observations
from src.feature_store.feature_group import upload_features
from src.feature_store.hopsworks_connection import connect
from src.features.feature_engineering import TARGET_COLUMNS, engineer_features


def incremental_frame(lookback_days: int = 9):
    client, frames = OpenMeteoClient(), []
    end, start = date.today() - timedelta(days=1), date.today() - timedelta(days=lookback_days)
    for city in CITIES:
        weather = client.fetch_historical(city, start, end, WEATHER_VARIABLES, "weather")
        air = client.fetch_historical(city, start, end, AIR_QUALITY_VARIABLES, "air_quality")
        frames.append(merge_weather_air_quality(weather, air))
    clean, _ = clean_observations(pd.concat(frames, ignore_index=True)); validate_observations(clean, require_target=False)
    featured = engineer_features(clean, include_targets=False)
    # Archive availability trails wall-clock time. Emit the newest complete hour,
    # rather than comparing with "now" and accidentally producing an empty batch.
    cutoff = featured["timestamp"].max()
    result = featured[featured.timestamp == cutoff].copy()
    for target in TARGET_COLUMNS:
        result[target] = pd.NA
    return result


def main():
    parser = argparse.ArgumentParser(); parser.add_argument("--upload", action="store_true"); args = parser.parse_args()
    logging.basicConfig(level=logging.INFO); frame = incremental_frame()
    if args.upload: upload_features(connect().get_feature_store(), frame)
    print(f"Incremental rows prepared: {len(frame)}")


if __name__ == "__main__": main()
