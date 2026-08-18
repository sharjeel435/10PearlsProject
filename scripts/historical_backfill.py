from __future__ import annotations

import argparse
import json
import logging
from pathlib import Path

import pandas as pd

from config.cities import CITIES
from config.settings import AIR_QUALITY_VARIABLES, SETTINGS, WEATHER_VARIABLES
from src.data.cleaner import clean_observations, merge_weather_air_quality
from src.data.openmeteo_client import OpenMeteoClient
from src.data.validator import validate_observations
from src.feature_store.feature_group import upload_features
from src.feature_store.hopsworks_connection import connect
from src.features.feature_engineering import engineer_features, usable_feature_columns
from src.features.feature_manifest import build_manifest

LOG = logging.getLogger(__name__)


def build_historical_frame(start=SETTINGS.historical_start, end=SETTINGS.historical_end):
    client, frames, raw_rows = OpenMeteoClient(), [], 0
    for city in CITIES:
        weather = client.fetch_historical(city, start, end, WEATHER_VARIABLES, "weather")
        air = client.fetch_historical(city, start, end, AIR_QUALITY_VARIABLES, "air_quality")
        raw_rows += len(weather) + len(air)
        frames.append(merge_weather_air_quality(weather, air))
    merged = pd.concat(frames, ignore_index=True)
    pre_report = validate_observations(merged)
    clean, cleaning = clean_observations(merged)
    post_report = validate_observations(clean)
    featured = engineer_features(clean)
    manifest = build_manifest(featured)
    SETTINGS.artifacts_dir.mkdir(parents=True, exist_ok=True)
    manifest.to_csv(SETTINGS.artifacts_dir / "feature_manifest.csv", index=False)
    city_quality = {}
    for city, group in clean.groupby("city", sort=False):
        report = validate_observations(group)
        gaps = report.missing_hours.get(city, 0)
        city_quality[city] = {"raw_rows": int(len(merged[merged.city == city])), "clean_rows": len(group),
                              "missing_timestamps": gaps, "duplicate_timestamps": report.duplicate_keys,
                              "missing_values": int(group.isna().sum().sum()), "largest_gap_hours": _largest_gap_hours(group),
                              "start": report.start, "end": report.end}
    summary = {"cities_processed": post_report.cities, "start_date": post_report.start, "end_date": post_report.end,
               "raw_records": raw_rows, "clean_records": len(clean), "feature_count": len(usable_feature_columns(featured)),
               "missing_percentage": round(featured.isna().mean().mean() * 100, 3), "feature_group_version": SETTINGS.feature_group_version,
               "pre_validation": pre_report.__dict__, "cleaning": cleaning, "by_city": city_quality}
    (SETTINGS.artifacts_dir / "data_quality_report.json").write_text(json.dumps(summary, indent=2, default=str), encoding="utf-8")
    return featured, summary


def _largest_gap_hours(group: pd.DataFrame) -> float:
    differences = group.sort_values("timestamp").timestamp.diff().dropna().dt.total_seconds().div(3600)
    return float(differences.max()) if len(differences) else 0.0


def balanced_sample(frame, row_limit: int):
    if row_limit <= 0 or row_limit >= len(frame):
        return frame
    city_count = frame["city"].nunique()
    per_city = max(1, row_limit // city_count)
    sample = frame.groupby("city", sort=False, group_keys=False).head(per_city)
    remaining = row_limit - len(sample)
    if remaining:
        sample = pd.concat([sample, frame.drop(index=sample.index).head(remaining)])
    return sample.sort_values(["city", "timestamp"], kind="stable").reset_index(drop=True)


def main():
    parser = argparse.ArgumentParser(); parser.add_argument("--upload", action="store_true"); parser.add_argument("--sample", type=int, default=0)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args(); logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    frame, summary = build_historical_frame()
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        frame.to_parquet(args.output, index=False)
    if args.upload:
        project = connect(); fs = project.get_feature_store()
        data = balanced_sample(frame, args.sample) if args.sample else frame
        upload_features(fs, data); summary["rows_uploaded"] = len(data)
    else: summary["rows_uploaded"] = 0
    print(json.dumps(summary, indent=2, default=str))


if __name__ == "__main__": main()
