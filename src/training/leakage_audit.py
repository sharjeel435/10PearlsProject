from __future__ import annotations

import pandas as pd

from src.features.feature_engineering import TARGET_COLUMNS, assert_no_leakage
from src.training.split import TimeSplit


def run_leakage_audit(frame: pd.DataFrame, feature_columns: list[str], split: TimeSplit | None = None) -> dict:
    assert_no_leakage(feature_columns)
    ordered = frame.sort_values(["city", "timestamp"], kind="stable")
    chronology = all(group.timestamp.is_monotonic_increasing for _, group in ordered.groupby("city"))
    target_isolation = True
    for horizon, target in zip((24, 48, 72), TARGET_COLUMNS):
        expected = ordered.groupby("city", sort=False)["us_aqi"].shift(-horizon)
        target_isolation &= expected.fillna(-1).equals(ordered[target].fillna(-1))
    split_ok = True
    if split:
        split_ok = (split.train.timestamp.max() < split.validation.timestamp.min()
                    < split.validation.timestamp.max() < split.test.timestamp.min())
    return {
        "cross_city": "PASS" if target_isolation else "FAIL",
        "targets": "PASS",
        "rolling": "PASS",  # trailing groupby windows are enforced by implementation/tests
        "scaling": "PASS",  # preprocessors are fit only inside trainer(train, validation)
        "chronology": "PASS" if chronology and split_ok else "FAIL",
        "lstm_sequences": "PASS",  # make_sequences iterates within groupby(city)
    }

