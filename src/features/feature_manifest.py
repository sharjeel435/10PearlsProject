from __future__ import annotations

import pandas as pd

from src.features.quality import audit_features


def _category(name: str) -> str:
    if "lag_" in name: return "lag"
    if "rolling_" in name: return "rolling"
    if "change_" in name: return "change"
    if "interaction" in name or "ratio" in name: return "interaction"
    if name.startswith(("hour", "day", "week", "month", "quarter", "year", "season", "is_weekend")): return "time"
    if "wind" in name: return "wind"
    if name.startswith(("high_", "aqi_above", "consecutive_")): return "episode"
    if name in {"city", "latitude", "longitude"}: return "entity"
    return "raw"


def build_manifest(df: pd.DataFrame) -> pd.DataFrame:
    _, quality = audit_features(df)
    quality.insert(1, "feature_category", quality.feature_name.map(_category))
    quality.insert(3, "description", quality.feature_name.str.replace("_", " ").str.capitalize())
    return quality[["feature_name", "feature_category", "dtype", "description",
                    "missing_percentage", "used_for_training", "reason_if_excluded"]]
