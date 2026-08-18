from __future__ import annotations

import numpy as np
import pandas as pd

from src.features.feature_engineering import TARGET_COLUMNS, assert_no_leakage


def model_columns(df: pd.DataFrame) -> tuple[list[str], list[str]]:
    excluded = {"timestamp", *TARGET_COLUMNS}
    categorical = ["city"] if "city" in df else []
    numeric = [c for c in df.columns if c not in excluded | set(categorical)
               and pd.api.types.is_numeric_dtype(df[c]) and df[c].notna().any()]
    assert_no_leakage(numeric + categorical)
    return numeric, categorical


def complete_rows(df: pd.DataFrame) -> pd.DataFrame:
    return df.dropna(subset=list(TARGET_COLUMNS)).replace([np.inf, -np.inf], np.nan)
