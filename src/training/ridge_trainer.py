from __future__ import annotations

import time

from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import Ridge
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from src.features.feature_engineering import TARGET_COLUMNS
from src.training.common import model_columns


def train_ridge(train, validation, alphas=(0.1, 1.0, 10.0, 100.0)):
    numeric, categorical = model_columns(train)
    preprocessor = ColumnTransformer([
        ("numeric", Pipeline([("imputer", SimpleImputer(strategy="median")), ("scale", StandardScaler())]), numeric),
        ("city", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical),
    ])
    best, best_rmse = None, float("inf")
    started = time.perf_counter()
    for alpha in alphas:
        model = Pipeline([("preprocessor", preprocessor), ("model", Ridge(alpha=alpha))])
        model.fit(train[numeric + categorical], train[list(TARGET_COLUMNS)])
        prediction = model.predict(validation[numeric + categorical])
        rmse = ((prediction - validation[list(TARGET_COLUMNS)].to_numpy()) ** 2).mean() ** .5
        if rmse < best_rmse:
            best, best_rmse = model, float(rmse)
    return best, {"alpha": best.named_steps["model"].alpha}, time.perf_counter() - started, numeric + categorical

