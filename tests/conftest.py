import numpy as np
import pandas as pd
import pytest


@pytest.fixture
def observations():
    frames = []
    for city, offset in (("Karachi", 0), ("Lahore", 1000)):
        n = 240
        x = np.arange(n, dtype=float) + offset
        frames.append(pd.DataFrame({
            "city": city, "latitude": 25.0, "longitude": 67.0,
            "timestamp": pd.date_range("2024-01-01", periods=n, freq="h", tz="UTC"),
            "temperature_2m": 20 + x % 12, "relative_humidity_2m": 50 + x % 20,
            "dew_point_2m": 10 + x % 8, "apparent_temperature": 21 + x % 12,
            "precipitation": x % 3, "rain": x % 2, "surface_pressure": 1000 + x % 10,
            "cloud_cover": x % 100, "wind_speed_10m": 3 + x % 10,
            "wind_direction_10m": x % 360, "wind_gusts_10m": 8 + x % 15,
            "pm10": 40 + x, "pm2_5": 20 + x, "carbon_monoxide": 200 + x,
            "nitrogen_dioxide": 30 + x, "sulphur_dioxide": 10 + x,
            "ozone": 50 + x, "us_aqi": (x % 300),
        }))
    return pd.concat(frames, ignore_index=True)

