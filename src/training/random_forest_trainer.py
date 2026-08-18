from __future__ import annotations

import time

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

from src.features.feature_engineering import TARGET_COLUMNS
from src.training.common import model_columns


def train_random_forest(train, validation, candidates=None, random_state=42):
    candidates = candidates or (
        # Shallow / fast — good as early baselines
        {"n_estimators": 80,  "max_depth": 12, "min_samples_leaf": 4, "max_features": "sqrt"},
        {"n_estimators": 100, "max_depth": 15, "min_samples_leaf": 2, "max_features": "sqrt"},
        {"n_estimators": 100, "max_depth": 15, "min_samples_leaf": 2, "max_features": 0.5},
        # Medium — previous best region
        {"n_estimators": 120, "max_depth": 18, "min_samples_leaf": 2, "max_features": 0.7},
        {"n_estimators": 120, "max_depth": 18, "min_samples_leaf": 4, "max_features": "sqrt"},
        {"n_estimators": 140, "max_depth": 20, "min_samples_leaf": 2, "max_features": "sqrt"},
        {"n_estimators": 140, "max_depth": 20, "min_samples_leaf": 1, "max_features": 0.6},
        # Deep / rich — previous winner and extensions
        {"n_estimators": 160, "max_depth": 24, "min_samples_leaf": 2, "max_features": "sqrt"},
        {"n_estimators": 160, "max_depth": 24, "min_samples_leaf": 1, "max_features": 0.5},
        {"n_estimators": 200, "max_depth": 28, "min_samples_leaf": 2, "max_features": "sqrt"},
    )
    numeric, categorical = model_columns(train)
    prep = ColumnTransformer([("numeric", SimpleImputer(strategy="median"), numeric),
                              ("city", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical)])
    best, best_rmse, best_params = None, float("inf"), None
    started = time.perf_counter()
    for params in candidates:
        forest = RandomForestRegressor(**params, min_samples_split=2, n_jobs=-1, random_state=random_state)
        model = Pipeline([("preprocessor", prep), ("model", forest)])
        model.fit(train[numeric + categorical], train[list(TARGET_COLUMNS)])
        pred = model.predict(validation[numeric + categorical])
        rmse = ((pred - validation[list(TARGET_COLUMNS)].to_numpy()) ** 2).mean() ** .5
        if rmse < best_rmse:
            best, best_rmse, best_params = model, float(rmse), params
    return best, best_params, time.perf_counter() - started, numeric + categorical
