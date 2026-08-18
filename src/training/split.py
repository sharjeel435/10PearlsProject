from dataclasses import dataclass

import pandas as pd


@dataclass
class TimeSplit:
    train: pd.DataFrame
    validation: pd.DataFrame
    test: pd.DataFrame


def chronological_split(df: pd.DataFrame, train_fraction: float = .70, validation_fraction: float = .15) -> TimeSplit:
    if not 0 < train_fraction < 1 or not 0 < validation_fraction < 1 or train_fraction + validation_fraction >= 1:
        raise ValueError("Invalid split fractions")
    ordered = df.sort_values("timestamp", kind="stable")
    timestamps = ordered["timestamp"].drop_duplicates().sort_values().reset_index(drop=True)
    train_end = timestamps.iloc[max(0, int(len(timestamps) * train_fraction) - 1)]
    valid_end = timestamps.iloc[max(0, int(len(timestamps) * (train_fraction + validation_fraction)) - 1)]
    return TimeSplit(ordered[ordered.timestamp <= train_end].copy(),
                     ordered[(ordered.timestamp > train_end) & (ordered.timestamp <= valid_end)].copy(),
                     ordered[ordered.timestamp > valid_end].copy())

