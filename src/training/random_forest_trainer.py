"""Random Forest trainer with expanded hyperparameter grid and weighted RMSE selection.

Model selection uses a weighted RMSE that prioritises near-term accuracy:
    w = 0.50 × 24h RMSE  +  0.30 × 48h RMSE  +  0.20 × 72h RMSE

This reflects the operational priority: the 24-hour forecast is the
highest-stakes decision window for public health advisories.
"""
from __future__ import annotations

import time

import numpy as np
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

from src.features.feature_engineering import TARGET_COLUMNS
from src.training.common import model_columns


_HORIZON_WEIGHTS = (0.50, 0.30, 0.20)   # 24h, 48h, 72h


def _weighted_rmse(pred: np.ndarray, truth: np.ndarray) -> float:
    per_horizon = np.sqrt(((pred - truth) ** 2).mean(axis=0))
    return float(np.dot(per_horizon, _HORIZON_WEIGHTS))


def train_random_forest(train, validation, candidates=None, random_state=42):
    candidates = candidates or (
        # ── Shallow / fast — warm-start baselines ──────────────────────────
        {"n_estimators": 80,  "max_depth": 12, "min_samples_leaf": 4, "max_features": "sqrt"},
        {"n_estimators": 100, "max_depth": 15, "min_samples_leaf": 2, "max_features": "sqrt"},
        {"n_estimators": 100, "max_depth": 15, "min_samples_leaf": 2, "max_features": 0.5},
        # ── Medium ─────────────────────────────────────────────────────────
        {"n_estimators": 120, "max_depth": 18, "min_samples_leaf": 2, "max_features": 0.7},
        {"n_estimators": 120, "max_depth": 18, "min_samples_leaf": 4, "max_features": "sqrt"},
        {"n_estimators": 140, "max_depth": 20, "min_samples_leaf": 2, "max_features": "sqrt"},
        {"n_estimators": 140, "max_depth": 20, "min_samples_leaf": 1, "max_features": 0.6},
        # ── Deep / rich — previous winner and extensions ───────────────────
        {"n_estimators": 160, "max_depth": 24, "min_samples_leaf": 2, "max_features": "sqrt"},
        {"n_estimators": 160, "max_depth": 24, "min_samples_leaf": 1, "max_features": 0.5},
        {"n_estimators": 200, "max_depth": 28, "min_samples_leaf": 2, "max_features": "sqrt"},
        # ── New: very deep / full-depth ─────────────────────────────────────
        {"n_estimators": 200, "max_depth": None, "min_samples_leaf": 2, "max_features": "sqrt"},
        {"n_estimators": 200, "max_depth": None, "min_samples_leaf": 1, "max_features": 0.4},
        {"n_estimators": 300, "max_depth": None, "min_samples_leaf": 2, "max_features": "sqrt"},
        {"n_estimators": 300, "max_depth": None, "min_samples_leaf": 2, "max_features": 0.5},
        {"n_estimators": 300, "max_depth": 32,   "min_samples_leaf": 1, "max_features": 0.4,
         "min_impurity_decrease": 0.005},
    )
    numeric, categorical = model_columns(train)
    prep = ColumnTransformer([
        ("numeric", SimpleImputer(strategy="median"), numeric),
        ("city", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical),
    ])
    truth_val = validation[list(TARGET_COLUMNS)].to_numpy()
    best, best_score, best_params = None, float("inf"), None
    started = time.perf_counter()
    for params in candidates:
        forest = RandomForestRegressor(
            **params, min_samples_split=2, n_jobs=-1, random_state=random_state
        )
        model = Pipeline([("preprocessor", prep), ("model", forest)])
        model.fit(train[numeric + categorical], train[list(TARGET_COLUMNS)])
        pred = model.predict(validation[numeric + categorical])
        score = _weighted_rmse(pred, truth_val)
        if score < best_score:
            best, best_score, best_params = model, score, params
    return best, best_params, time.perf_counter() - started, numeric + categorical
