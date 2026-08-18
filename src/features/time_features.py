import numpy as np
import pandas as pd


def add_time_features(df: pd.DataFrame) -> pd.DataFrame:
    ts = df["timestamp"]
    iso = ts.dt.isocalendar()
    values = {
        "hour": ts.dt.hour, "day": ts.dt.day, "day_of_week": ts.dt.dayofweek,
        "day_of_month": ts.dt.day, "day_of_year": ts.dt.dayofyear,
        "week_of_year": iso.week.astype("int16"), "month": ts.dt.month,
        "quarter": ts.dt.quarter, "year": ts.dt.year,
        "is_weekend": ts.dt.dayofweek.ge(5).astype("int8"),
        "season": ((ts.dt.month % 12) // 3).astype("int8"),
    }
    for name, series in values.items():
        df[name] = series
    for name, period in (("hour", 24), ("day_of_week", 7), ("month", 12), ("day_of_year", 365.25)):
        df[f"{name}_sin"] = np.sin(2 * np.pi * df[name] / period)
        df[f"{name}_cos"] = np.cos(2 * np.pi * df[name] / period)
    return df

