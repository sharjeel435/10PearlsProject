from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from config.settings import TARGET_HORIZONS


def regression_metrics(y_true, y_pred) -> dict[str, float]:
    return {"rmse": float(np.sqrt(mean_squared_error(y_true, y_pred))),
            "mae": float(mean_absolute_error(y_true, y_pred)), "r2": float(r2_score(y_true, y_pred))}


def evaluate_predictions(y_true, y_pred, cities) -> pd.DataFrame:
    truth, pred = np.asarray(y_true), np.asarray(y_pred)
    rows = []
    for city in ["overall", *sorted(pd.Series(cities).unique())]:
        mask = np.ones(len(truth), dtype=bool) if city == "overall" else np.asarray(cities) == city
        for index, horizon in enumerate(TARGET_HORIZONS):
            rows.append({"city": city, "horizon": horizon, **regression_metrics(truth[mask, index], pred[mask, index])})
    return pd.DataFrame(rows)


def comparison_row(name: str, metrics: pd.DataFrame, training_time: float) -> dict:
    overall = metrics[metrics.city == "overall"]
    return {"model": name, **{f"{h}h_rmse": float(overall.loc[overall.horizon == h, "rmse"].iloc[0]) for h in TARGET_HORIZONS},
            "overall_rmse": float(overall.rmse.mean()), "mae": float(overall.mae.mean()),
            "r2": float(overall.r2.mean()), "training_time_seconds": training_time}

