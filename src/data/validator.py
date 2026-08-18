from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np
import pandas as pd


@dataclass
class ValidationReport:
    rows: int
    cities: list[str]
    start: str | None
    end: str | None
    duplicate_keys: int = 0
    missing_hours: dict[str, int] = field(default_factory=dict)
    missing_values: dict[str, int] = field(default_factory=dict)
    invalid_counts: dict[str, int] = field(default_factory=dict)

    @property
    def valid(self) -> bool:
        return self.duplicate_keys == 0 and not any(self.invalid_counts.values())


def validate_observations(df: pd.DataFrame, require_target: bool = True) -> ValidationReport:
    required = {"city", "latitude", "longitude", "timestamp"}
    if require_target:
        required.add("us_aqi")
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {sorted(missing)}")
    if df.empty:
        raise ValueError("Dataset is empty")
    if not isinstance(df["timestamp"].dtype, pd.DatetimeTZDtype):
        raise ValueError("timestamp must be timezone-aware")
    duplicate_keys = int(df.duplicated(["city", "timestamp"]).sum())
    missing_hours = {}
    for city, group in df.groupby("city", sort=False):
        expected = pd.date_range(group["timestamp"].min(), group["timestamp"].max(), freq="h")
        missing_hours[str(city)] = int(len(expected.difference(pd.DatetimeIndex(group["timestamp"]))))
    invalid = {}
    for col in ("pm10", "pm2_5", "carbon_monoxide", "nitrogen_dioxide", "sulphur_dioxide", "ozone"):
        if col in df:
            invalid[f"negative_{col}"] = int((df[col] < 0).sum())
    if "relative_humidity_2m" in df:
        invalid["invalid_humidity"] = int((~df["relative_humidity_2m"].between(0, 100) & df["relative_humidity_2m"].notna()).sum())
    if "us_aqi" in df:
        invalid["invalid_aqi"] = int((~df["us_aqi"].between(0, 500) & df["us_aqi"].notna()).sum())
    numeric = df.select_dtypes(include=np.number)
    invalid["infinite_values"] = int(np.isinf(numeric).sum().sum())
    return ValidationReport(
        rows=len(df), cities=sorted(df["city"].unique().tolist()),
        start=df["timestamp"].min().isoformat(), end=df["timestamp"].max().isoformat(),
        duplicate_keys=duplicate_keys, missing_hours=missing_hours,
        missing_values={k: int(v) for k, v in df.isna().sum().items() if v}, invalid_counts=invalid,
    )


def assert_hopsworks_schema(df: pd.DataFrame) -> None:
    required = {"city", "latitude", "longitude", "timestamp", "us_aqi"}
    if required - set(df):
        raise ValueError(f"Invalid feature group schema; missing {sorted(required - set(df))}")
    if df.duplicated(["city", "timestamp"]).any():
        raise ValueError("Feature group primary key is not unique")

