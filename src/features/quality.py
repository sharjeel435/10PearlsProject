from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd

from src.features.feature_engineering import TARGET_COLUMNS, assert_no_leakage


@dataclass(frozen=True)
class FeatureQualityConfig:
    maximum_missing_fraction: float = 0.50
    near_zero_variance_fraction: float = 0.995
    maximum_absolute_correlation: float = 0.9999


def audit_features(frame: pd.DataFrame, config: FeatureQualityConfig = FeatureQualityConfig()):
    excluded = {"timestamp", *TARGET_COLUMNS}
    candidates = [c for c in frame.columns if c not in excluded]
    assert_no_leakage(candidates)
    rows, signatures, selected = [], {}, []
    for name in candidates:
        series = frame[name]
        missing = float(series.isna().mean())
        reason = ""
        if name in {"latitude", "longitude"}:
            reason = "raw_identifier"
        elif missing > config.maximum_missing_fraction:
            reason = "high_missingness"
        elif series.nunique(dropna=True) <= 1:
            reason = "constant"
        elif len(series) and series.value_counts(dropna=False, normalize=True).iloc[0] >= config.near_zero_variance_fraction:
            reason = "near_zero_variance"
        else:
            signature = pd.util.hash_pandas_object(series, index=False).sum()
            key = (str(series.dtype), int(signature))
            if key in signatures and series.equals(frame[signatures[key]]):
                reason = f"duplicate_of:{signatures[key]}"
            else:
                signatures[key] = name
        used = not reason
        if used:
            selected.append(name)
        rows.append({"feature_name": name, "dtype": str(series.dtype),
                     "missing_percentage": missing * 100, "unique_values": int(series.nunique(dropna=True)),
                     "used_for_training": used, "reason_if_excluded": reason})
    report = pd.DataFrame(rows)
    if len(selected) < 100:
        raise ValueError(f"Feature filtering left only {len(selected)} predictors")
    return selected, report

