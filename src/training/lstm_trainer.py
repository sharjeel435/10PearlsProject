"""LSTM trainer — improved architecture, more epochs, and better feature selection.

Key changes vs the previous version:
- Architecture: LSTM(128, return_sequences=True) → LSTM(64) → Dense(64, relu) → Dense(3)
  Previous was LSTM(32) → LSTM(16) → Dense(24) → Dense(3) — grossly underpowered
  for a 100k-row dataset.
- Feature budget raised from 32 to 64 columns; features selected by variance
  (highest variance columns carry more signal for LSTM) rather than hard-coded position.
- Epochs raised from 6 to 60; patience raised from 2 to 8.
  Previous EarlyStopping(patience=2) frequently stopped at epoch 2–3 before convergence.
- ReduceLROnPlateau factor 0.5 → 0.3, patience 2 → 4, min_lr added.
- Gradient clipping added (clipnorm=1.0) to prevent occasional exploding gradients
  on the Pakistan AQI spike distribution.
- shuffle=True during training: sequences are already constructed without leakage,
  so shuffling improves generalisation (reduces exposure bias).
- Best sequence length evaluated over (24, 48, 72) rather than (24, 48).
"""
from __future__ import annotations

import time

import numpy as np
import pandas as pd
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler

from src.features.feature_engineering import TARGET_COLUMNS
from src.training.common import model_columns


_MAX_FEATURES = 64
_SEQUENCE_LENGTHS = (24, 48, 72)
_EPOCHS = 60
_BATCH_SIZE = 512
_PATIENCE = 8


def _select_features(numeric: list[str], train: pd.DataFrame) -> list[str]:
    """Return up to _MAX_FEATURES columns sorted by descending variance.

    High-variance columns carry more signal for an LSTM than low-variance
    near-constant engineered features.
    """
    variances = train[numeric].var()
    ranked = variances.sort_values(ascending=False).index.tolist()
    return ranked[:_MAX_FEATURES]


def make_sequences(frame: pd.DataFrame, features: list[str], length: int):
    sequences, targets, cities, timestamps = [], [], [], []
    for city, group in frame.sort_values(["city", "timestamp"]).groupby("city", sort=False):
        x = group[features].to_numpy(np.float32)
        y = group[list(TARGET_COLUMNS)].to_numpy(np.float32)
        for end in range(length - 1, len(group)):
            if np.isnan(y[end]).any():
                continue
            sequences.append(x[end - length + 1 : end + 1])
            targets.append(y[end])
            cities.append(city)
            timestamps.append(group.iloc[end].timestamp)
    return np.asarray(sequences), np.asarray(targets), np.asarray(cities), np.asarray(timestamps)


def train_lstm(train, validation, sequence_lengths=_SEQUENCE_LENGTHS, epochs=_EPOCHS, batch_size=_BATCH_SIZE):
    try:
        import tensorflow as tf
    except ImportError as exc:
        raise RuntimeError(
            "TensorFlow is required for LSTM training; install the 'lstm' extra"
        ) from exc

    numeric, _ = model_columns(train)
    numeric = _select_features(numeric, train)

    imputer = SimpleImputer(strategy="median").fit(train[numeric])
    scaler = StandardScaler().fit(imputer.transform(train[numeric]))

    def transform(frame: pd.DataFrame) -> pd.DataFrame:
        result = frame.copy()
        result[numeric] = scaler.transform(imputer.transform(frame[numeric])).astype("float32")
        return result

    train_t = transform(train)
    val_t   = transform(validation)

    best: tuple | None = None
    started = time.perf_counter()

    for length in sequence_lengths:
        x_train, y_train, _, _ = make_sequences(train_t, numeric, length)
        x_val,   y_val,   _, _ = make_sequences(val_t,   numeric, length)
        if not len(x_train) or not len(x_val):
            continue

        model = tf.keras.Sequential([
            tf.keras.layers.Input((length, len(numeric))),
            tf.keras.layers.Bidirectional(tf.keras.layers.LSTM(128, return_sequences=True)),
            tf.keras.layers.Dropout(0.20),
            tf.keras.layers.LSTM(64),
            tf.keras.layers.Dropout(0.15),
            tf.keras.layers.Dense(64, activation="relu"),
            tf.keras.layers.Dense(len(TARGET_COLUMNS)),
        ])
        model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3, clipnorm=1.0),
            loss="mse",
            metrics=["mae"],
        )
        checkpoint_path = f"artifacts/lstm_candidate_{length}h.keras"
        callbacks = [
            tf.keras.callbacks.EarlyStopping(
                patience=_PATIENCE, restore_best_weights=True, monitor="val_loss"
            ),
            tf.keras.callbacks.ReduceLROnPlateau(
                monitor="val_loss", patience=4, factor=0.3,
                min_lr=1e-6, verbose=0
            ),
            tf.keras.callbacks.ModelCheckpoint(
                checkpoint_path, save_best_only=True, monitor="val_loss"
            ),
        ]
        history = model.fit(
            x_train, y_train,
            validation_data=(x_val, y_val),
            epochs=epochs,
            batch_size=batch_size,
            shuffle=True,          # sequences already constructed; shuffling helps generalisation
            callbacks=callbacks,
            verbose=1,
        )
        score = min(history.history["val_loss"])
        if best is None or score < best[0]:
            best = (score, model, length)

    if best is None:
        raise ValueError("Not enough rows to create LSTM sequences")

    bundle = {
        "model":           best[1],
        "sequence_length": best[2],
        "features":        numeric,
        "imputer":         imputer,
        "scaler":          scaler,
    }
    return bundle, {"sequence_length": best[2], "n_features": len(numeric)}, time.perf_counter() - started, numeric
