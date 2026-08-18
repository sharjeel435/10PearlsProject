from __future__ import annotations

import numpy as np
import pandas as pd

from config.settings import TARGET_HORIZONS
from src.features.interaction_features import add_interaction_features, safe_ratio
from src.features.lag_features import add_lag_features
from src.features.rolling_features import add_rolling_features
from src.features.time_features import add_time_features

TARGET_COLUMNS = tuple(f"target_aqi_{h}h" for h in TARGET_HORIZONS)
NON_FEATURE_COLUMNS = {"timestamp", *TARGET_COLUMNS}


def add_change_features(df: pd.DataFrame) -> pd.DataFrame:
    specs = {
        "us_aqi": ("aqi", (1, 3, 6, 24)), "pm2_5": ("pm25", (1, 3, 6, 24)),
        "pm10": ("pm10", (1, 6, 24)), "temperature_2m": ("temperature", (1, 6, 24)),
        "relative_humidity_2m": ("humidity", (1, 6, 24)), "surface_pressure": ("pressure", (3, 6, 24)),
        "wind_speed_10m": ("wind", (1, 6, 24)),
    }
    additions = {}
    grouped = df.groupby("city", sort=False)
    for source, (prefix, periods) in specs.items():
        if source not in df:
            continue
        for period in periods:
            lag = grouped[source].shift(period)
            additions[f"{prefix}_change_{period}h"] = df[source] - lag
            if source in {"us_aqi", "pm2_5", "pm10"}:
                additions[f"{prefix}_pct_change_{period}h"] = safe_ratio(df[source] - lag, lag)
    return pd.concat([df, pd.DataFrame(additions, index=df.index)], axis=1)


def create_targets(df: pd.DataFrame) -> pd.DataFrame:
    grouped = df.groupby("city", sort=False)["us_aqi"]
    for horizon in TARGET_HORIZONS:
        df[f"target_aqi_{horizon}h"] = grouped.shift(-horizon)
    return df


def assert_no_leakage(feature_columns: list[str]) -> None:
    forbidden = [c for c in feature_columns if c in TARGET_COLUMNS or c.startswith("target_")]
    if forbidden:
        raise ValueError(f"Target leakage detected: {forbidden}")
    future_names = [c for c in feature_columns if "lead_" in c or "future_" in c]
    if future_names:
        raise ValueError(f"Future feature names detected: {future_names}")


def usable_feature_columns(df: pd.DataFrame) -> list[str]:
    columns = [c for c in df.columns if c not in NON_FEATURE_COLUMNS]
    assert_no_leakage(columns)
    return columns


def engineer_features(df: pd.DataFrame, include_targets: bool = True) -> pd.DataFrame:
    result = df.sort_values(["city", "timestamp"], kind="stable").reset_index(drop=True).copy()
    result = add_time_features(result)
    result = add_lag_features(result)
    result = add_rolling_features(result)
    result = add_change_features(result)
    result = add_interaction_features(result)
    if include_targets:
        result = create_targets(result)
    result.replace([np.inf, -np.inf], np.nan, inplace=True)
    features = usable_feature_columns(result)
    if len(features) < 100:
        raise AssertionError(f"Only {len(features)} usable features generated; at least 100 required")
    return result

