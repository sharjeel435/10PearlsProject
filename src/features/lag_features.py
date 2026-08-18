import pandas as pd

from config.settings import AQI_LAGS, POLLUTANT_LAGS, WEATHER_LAGS


def add_lag_features(df: pd.DataFrame) -> pd.DataFrame:
    specs = {
        "us_aqi": (AQI_LAGS, "aqi"),
        "pm2_5": (POLLUTANT_LAGS, "pm25"), "pm10": (POLLUTANT_LAGS, "pm10"),
        "carbon_monoxide": (POLLUTANT_LAGS, "co"), "nitrogen_dioxide": (POLLUTANT_LAGS, "no2"),
        "sulphur_dioxide": (POLLUTANT_LAGS, "so2"), "ozone": (POLLUTANT_LAGS, "o3"),
        "temperature_2m": (WEATHER_LAGS, "temperature"),
        "relative_humidity_2m": (WEATHER_LAGS, "humidity"),
        "surface_pressure": (WEATHER_LAGS, "pressure"), "wind_speed_10m": (WEATHER_LAGS, "wind"),
        "precipitation": (WEATHER_LAGS, "precipitation"), "dew_point_2m": (WEATHER_LAGS, "dew_point"),
    }
    grouped = df.groupby("city", sort=False)
    additions = {}
    for source, (lags, prefix) in specs.items():
        if source in df:
            for lag in lags:
                additions[f"{prefix}_lag_{lag}h"] = grouped[source].shift(lag)
    return pd.concat([df, pd.DataFrame(additions, index=df.index)], axis=1)

