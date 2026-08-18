import pandas as pd

from config.settings import ROLLING_WINDOWS


def add_rolling_features(df: pd.DataFrame) -> pd.DataFrame:
    variables = {"us_aqi": "aqi", "pm2_5": "pm25", "pm10": "pm10",
                 "temperature_2m": "temperature", "relative_humidity_2m": "humidity",
                 "wind_speed_10m": "wind"}
    additions = {}
    for source, prefix in variables.items():
        if source not in df:
            continue
        grouped = df.groupby("city", sort=False)[source]
        for window in ROLLING_WINDOWS:
            roll = grouped.rolling(window, min_periods=1)
            for statistic in ("mean", "min", "max", "std"):
                additions[f"{prefix}_rolling_{statistic}_{window}h"] = getattr(roll, statistic)().reset_index(level=0, drop=True)
    return pd.concat([df, pd.DataFrame(additions, index=df.index)], axis=1)
