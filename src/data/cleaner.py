from __future__ import annotations

import logging

import numpy as np
import pandas as pd

LOG = logging.getLogger(__name__)
POLLUTANTS = ("pm10", "pm2_5", "carbon_monoxide", "nitrogen_dioxide", "sulphur_dioxide", "ozone")


def merge_weather_air_quality(weather: pd.DataFrame, air: pd.DataFrame) -> pd.DataFrame:
    keys = ["city", "latitude", "longitude", "timestamp"]
    merged = weather.merge(air, on=keys, how="inner", validate="one_to_one")
    return merged.sort_values(["city", "timestamp"], kind="stable").reset_index(drop=True)


def clean_observations(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    before = len(df)
    result = df.copy()
    result["timestamp"] = pd.to_datetime(result["timestamp"], utc=True, errors="coerce")
    invalid_time = int(result["timestamp"].isna().sum())
    result = result.dropna(subset=["timestamp", "city"]).drop_duplicates(["city", "timestamp"], keep="last")
    bounds = {**{p: (0, None) for p in POLLUTANTS}, "relative_humidity_2m": (0, 100), "us_aqi": (0, 500)}
    invalid_values = 0
    for col, (low, high) in bounds.items():
        if col not in result:
            continue
        mask = result[col].lt(low)
        if high is not None:
            mask |= result[col].gt(high)
        invalid_values += int(mask.sum())
        result.loc[mask, col] = np.nan
    numeric = result.select_dtypes(include=np.number).columns
    result[numeric] = result[numeric].replace([np.inf, -np.inf], np.nan)
    # Short internal gaps only; no blanket zero fill and no cross-city interpolation.
    for col in numeric:
        result[col] = result.groupby("city", sort=False)[col].transform(
            lambda s: s.interpolate(limit=3, limit_area="inside")
        )
    result = result.sort_values(["city", "timestamp"], kind="stable").reset_index(drop=True)
    report = {"rows_downloaded": before, "rows_removed": before - len(result),
              "invalid_timestamps": invalid_time, "invalid_values_set_missing": invalid_values,
              "rows_after_cleaning": len(result), "missing_values": int(result.isna().sum().sum())}
    LOG.info("Cleaning report: %s", report)
    return result, report

