"""HistGradientBoostingRegressor trainer.

HistGBT handles missing values natively (no imputer needed), trains in
O(n · bins) rather than O(n · features), and typically outperforms random
forest by 5-15 % on structured tabular time-series with ≥50k rows.

Model selection uses a weighted RMSE that penalises near-term errors more
heavily: w = 0.50 × 24h + 0.30 × 48h + 0.20 × 72h.
"""
from __future__ import annotations

import time

import numpy as np
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.multioutput import MultiOutputRegressor
from sklearn.preprocessing import OrdinalEncoder
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer

from src.features.feature_engineering import TARGET_COLUMNS
from src.training.common import model_columns


_HORIZON_WEIGHTS = (0.50, 0.30, 0.20)   # 24h, 48h, 72h


def _weighted_rmse(pred: np.ndarray, truth: np.ndarray) -> float:
    per_horizon = np.sqrt(((pred - truth) ** 2).mean(axis=0))   # shape (3,)
    return float(np.dot(per_horizon, _HORIZON_WEIGHTS))


_CANDIDATES = [
    # fast / regularised — good warm-start reference
    {"max_iter": 200, "max_depth": 6,    "learning_rate": 0.10, "min_samples_leaf": 20, "l2_regularization": 0.1},
    {"max_iter": 200, "max_depth": 8,    "learning_rate": 0.10, "min_samples_leaf": 20, "l2_regularization": 0.0},
    # medium depth
    {"max_iter": 300, "max_depth": 10,   "learning_rate": 0.08, "min_samples_leaf": 10, "l2_regularization": 0.0},
    {"max_iter": 300, "max_depth": 12,   "learning_rate": 0.08, "min_samples_leaf": 10, "l2_regularization": 0.0},
    # deeper / lower LR — best generalisation zone for large datasets
    {"max_iter": 400, "max_depth": None, "learning_rate": 0.05, "min_samples_leaf": 20, "l2_regularization": 0.0},
    {"max_iter": 500, "max_depth": None, "learning_rate": 0.05, "min_samples_leaf": 10, "l2_regularization": 0.0},
    {"max_iter": 500, "max_depth": None, "learning_rate": 0.03, "min_samples_leaf": 20, "l2_regularization": 0.1},
]


def train_hgbt(train, validation, candidates=None, random_state: int = 42):
    candidates = candidates or _CANDIDATES
    numeric, categorical = model_columns(train)
    all_cols = numeric + categorical

    # OrdinalEncoder for city — HGBT supports ordinal-encoded categoricals natively
    prep = ColumnTransformer(
        [
            ("num", "passthrough", numeric),
            ("cat", OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1), categorical),
        ],
        remainder="drop",
    )

    best_model, best_score, best_params = None, float("inf"), None
    started = time.perf_counter()

    truth_val = validation[list(TARGET_COLUMNS)].to_numpy()

    for params in candidates:
        base = HistGradientBoostingRegressor(
            **params,
            random_state=random_state,
            early_stopping=False,   # we roll our own val-set selection
        )
        # MultiOutputRegressor fits one independent estimator per target horizon.
        # This lets each horizon specialise its own tree depth / LR profile.
        mor = MultiOutputRegressor(base, n_jobs=-1)
        pipe = Pipeline([("prep", prep), ("model", mor)])
        pipe.fit(train[all_cols], train[list(TARGET_COLUMNS)])
        pred = pipe.predict(validation[all_cols])
        score = _weighted_rmse(pred, truth_val)
        if score < best_score:
            best_model, best_score, best_params = pipe, score, params

    elapsed = time.perf_counter() - started
    return best_model, best_params, elapsed, all_cols
