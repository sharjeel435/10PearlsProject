from __future__ import annotations

import numpy as np
import pandas as pd

from config.settings import TARGET_HORIZONS


def current_aqi_baseline(frame: pd.DataFrame) -> np.ndarray:
    return np.repeat(frame[["us_aqi"]].to_numpy(), len(TARGET_HORIZONS), axis=1)


def seasonal_persistence_baseline(frame: pd.DataFrame) -> np.ndarray:
    predictions = []
    for horizon in TARGET_HORIZONS:
        preferred = f"aqi_lag_{24 if horizon == 24 else horizon - 24}h"
        values = frame[preferred] if preferred in frame else frame["us_aqi"]
        predictions.append(values.fillna(frame["us_aqi"]).to_numpy())
    return np.column_stack(predictions)

