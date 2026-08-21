"""Hopsworks Model Serving wrapper for the registered AQI sklearn bundle."""

from __future__ import annotations

import os
from collections import UserList
from pathlib import Path

import joblib
import pandas as pd


def _install_sklearn_pickle_compatibility():
    """Provide sklearn 1.5's private list wrapper on older serving images."""
    import sklearn.compose._column_transformer as column_transformer

    if not hasattr(column_transformer, "_RemainderColsList"):
        class _RemainderColsList(UserList):
            def __init__(self, columns, **kwargs):
                super().__init__(columns)

        _RemainderColsList.__module__ = column_transformer.__name__
        column_transformer._RemainderColsList = _RemainderColsList


class Predictor:
    def __init__(self):
        _install_sklearn_pickle_compatibility()
        model_root = Path(os.environ["MODEL_FILES_PATH"])
        candidates = list(model_root.rglob("model.joblib"))
        if len(candidates) != 1:
            raise RuntimeError(f"Expected one model.joblib, found {len(candidates)}")
        bundle = joblib.load(candidates[0])
        if not isinstance(bundle, dict) or not {"model", "feature_columns"} <= bundle.keys():
            raise RuntimeError("Invalid AQI model bundle")
        self.model = bundle["model"]
        self.feature_columns = list(bundle["feature_columns"])

    def predict(self, inputs):
        records = inputs.get("instances", inputs) if isinstance(inputs, dict) else inputs
        if isinstance(records, dict):
            records = [records]
        frame = pd.DataFrame(records)
        missing = [column for column in self.feature_columns if column not in frame.columns]
        if missing:
            raise ValueError(f"Missing {len(missing)} required features; first: {missing[:5]}")
        predictions = self.model.predict(frame[self.feature_columns])
        return [
            {
                "predicted_aqi_24h": float(row[0]),
                "predicted_aqi_48h": float(row[1]),
                "predicted_aqi_72h": float(row[2]),
            }
            for row in predictions
        ]
