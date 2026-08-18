from __future__ import annotations

import time

import numpy as np
import pandas as pd
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler

from src.features.feature_engineering import TARGET_COLUMNS
from src.training.common import model_columns


def make_sequences(frame: pd.DataFrame, features: list[str], length: int):
    sequences, targets, cities, timestamps = [], [], [], []
    for city, group in frame.sort_values(["city", "timestamp"]).groupby("city", sort=False):
        x, y = group[features].to_numpy(np.float32), group[list(TARGET_COLUMNS)].to_numpy(np.float32)
        for end in range(length - 1, len(group)):
            if np.isnan(y[end]).any():
                continue
            sequences.append(x[end - length + 1:end + 1])
            targets.append(y[end]); cities.append(city); timestamps.append(group.iloc[end].timestamp)
    return np.asarray(sequences), np.asarray(targets), np.asarray(cities), np.asarray(timestamps)


def train_lstm(train, validation, sequence_lengths=(24, 48), epochs=6, batch_size=512):
    try:
        import tensorflow as tf
    except ImportError as exc:
        raise RuntimeError("TensorFlow is required for LSTM training; install the 'lstm' extra") from exc
    numeric, _ = model_columns(train)
    preferred = [c for c in numeric if c in {
        "us_aqi", "pm2_5", "pm10", "carbon_monoxide", "nitrogen_dioxide", "sulphur_dioxide", "ozone",
        "temperature_2m", "relative_humidity_2m", "surface_pressure", "wind_speed_10m", "precipitation",
        "hour_sin", "hour_cos", "day_of_week_sin", "day_of_week_cos", "month_sin", "month_cos",
    } or c.startswith(("aqi_lag_", "pm25_lag_", "aqi_rolling_mean_"))]
    numeric = preferred[:32]
    imputer = SimpleImputer(strategy="median").fit(train[numeric])
    scaler = StandardScaler().fit(imputer.transform(train[numeric]))

    def transform(frame):
        result = frame.copy()
        result[numeric] = scaler.transform(imputer.transform(frame[numeric])).astype("float32")
        return result

    best = None
    started = time.perf_counter()
    for length in sequence_lengths:
        x_train, y_train, _, _ = make_sequences(transform(train), numeric, length)
        x_val, y_val, _, _ = make_sequences(transform(validation), numeric, length)
        if not len(x_train) or not len(x_val):
            continue
        model = tf.keras.Sequential([
            tf.keras.layers.Input((length, len(numeric))), tf.keras.layers.LSTM(32, return_sequences=True),
            tf.keras.layers.Dropout(.25), tf.keras.layers.LSTM(16), tf.keras.layers.Dense(24, activation="relu"),
            tf.keras.layers.Dense(len(TARGET_COLUMNS)),
        ])
        model.compile(optimizer="adam", loss="mse", metrics=["mae"])
        checkpoint = f"artifacts/lstm_candidate_{length}h.keras"
        callbacks = [tf.keras.callbacks.EarlyStopping(patience=2, restore_best_weights=True),
                     tf.keras.callbacks.ReduceLROnPlateau(patience=2, factor=.5),
                     tf.keras.callbacks.ModelCheckpoint(checkpoint, save_best_only=True)]
        history = model.fit(x_train, y_train, validation_data=(x_val, y_val), epochs=epochs,
                            batch_size=batch_size, shuffle=False, callbacks=callbacks, verbose=1)
        score = min(history.history["val_loss"])
        if best is None or score < best[0]:
            best = (score, model, length)
    if best is None:
        raise ValueError("Not enough rows to create LSTM sequences")
    bundle = {"model": best[1], "sequence_length": best[2], "features": numeric,
              "imputer": imputer, "scaler": scaler}
    return bundle, {"sequence_length": best[2]}, time.perf_counter() - started, numeric
