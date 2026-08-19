import numpy as np
import pandas as pd

from config.settings import EPISODE_THRESHOLDS


def safe_ratio(numerator: pd.Series, denominator: pd.Series) -> pd.Series:
    return numerator.div(denominator.where(denominator.abs().gt(1e-9))).replace([np.inf, -np.inf], np.nan)


def _streak(flag: pd.Series) -> pd.Series:
    blocks = (~flag).cumsum()
    return flag.groupby(blocks).cumsum().astype("int32")


def add_interaction_features(df: pd.DataFrame) -> pd.DataFrame:
    a = {}

    # ── Pollutant ratios ──────────────────────────────────────────────────────
    ratios = {
        "pm25_pm10_ratio":     ("pm2_5",             "pm10"),
        "pm25_to_aqi_ratio":   ("pm2_5",             "us_aqi"),
        "pm10_to_aqi_ratio":   ("pm10",              "us_aqi"),
        "no2_o3_ratio":        ("nitrogen_dioxide",  "ozone"),
        "co_no2_ratio":        ("carbon_monoxide",   "nitrogen_dioxide"),
    }
    for name, (x, y) in ratios.items():
        if x in df and y in df:
            a[name] = safe_ratio(df[x], df[y])

    # ── Thermodynamic & dispersion products ───────────────────────────────────
    products = {
        "temperature_humidity_interaction":  ("temperature_2m",        "relative_humidity_2m"),
        "temperature_pressure_interaction":  ("temperature_2m",        "surface_pressure"),
        "humidity_pressure_interaction":     ("relative_humidity_2m",  "surface_pressure"),
        "wind_pm25_interaction":             ("wind_speed_10m",        "pm2_5"),
        "wind_pm10_interaction":             ("wind_speed_10m",        "pm10"),
        "wind_aqi_interaction":              ("wind_speed_10m",        "us_aqi"),
        "humidity_pm25_interaction":         ("relative_humidity_2m",  "pm2_5"),
        "humidity_pm10_interaction":         ("relative_humidity_2m",  "pm10"),
        "temperature_pm25_interaction":      ("temperature_2m",        "pm2_5"),
        "temperature_ozone_interaction":     ("temperature_2m",        "ozone"),
        "pm25_no2_interaction":              ("pm2_5",                 "nitrogen_dioxide"),
    }
    for name, (x, y) in products.items():
        if x in df and y in df:
            a[name] = df[x] * df[y]

    # ── Wind vector decomposition ─────────────────────────────────────────────
    if "wind_direction_10m" in df:
        radians = np.deg2rad(df["wind_direction_10m"])
        a["wind_direction_sin"] = np.sin(radians)
        a["wind_direction_cos"] = np.cos(radians)

    if "wind_speed_10m" in df:
        a["wind_speed_squared"] = df["wind_speed_10m"].pow(2)
        a["calm_wind"]  = df["wind_speed_10m"].lt(2).astype("int8")
        a["low_wind"]   = df["wind_speed_10m"].between(2, 5, inclusive="left").astype("int8")
        a["high_wind"]  = df["wind_speed_10m"].ge(20).astype("int8")

    # ── Hazard-episode flags ──────────────────────────────────────────────────
    flags = {
        "high_pm25":     ("pm2_5",            "pm2_5"),
        "high_pm10":     ("pm10",             "pm10"),
        "high_no2":      ("nitrogen_dioxide", "nitrogen_dioxide"),
        "high_ozone":    ("ozone",            "ozone"),
        "aqi_above_100": ("us_aqi",           "aqi_100"),
        "aqi_above_150": ("us_aqi",           "aqi_150"),
        "aqi_above_200": ("us_aqi",           "aqi_200"),
    }
    for name, (column, threshold) in flags.items():
        if column in df:
            a[name] = df[column].gt(EPISODE_THRESHOLDS[threshold]).astype("int8")

    # ── Boundary-layer stability index ────────────────────────────────────────
    # A proxy for atmospheric temperature inversion events.  During inversions,
    # the mixing layer collapses and pollutants accumulate near the surface.
    # High temperature + high humidity + low pressure → stable/trapped boundary layer.
    if "temperature_2m" in df and "relative_humidity_2m" in df and "surface_pressure" in df:
        a["boundary_stability_index"] = (
            df["temperature_2m"] * df["relative_humidity_2m"]
            / df["surface_pressure"].clip(lower=1.0)
        )

    # Dew-point depression: a small depression (T ≈ Td) means near-saturation
    # and predicts fog / smog events that trap particulates.
    if "temperature_2m" in df and "dew_point_2m" in df:
        a["dew_point_depression"] = df["temperature_2m"] - df["dew_point_2m"]

    # Ventilation coefficient proxy: wind × mixing depth.
    # Low ventilation → accumulation.  Use wind_speed as mixing-depth proxy.
    if "wind_speed_10m" in df and "surface_pressure" in df:
        a["ventilation_proxy"] = df["wind_speed_10m"] / df["surface_pressure"].clip(lower=1.0)

    result = pd.concat([df, pd.DataFrame(a, index=df.index)], axis=1)

    if "aqi_above_100" in result:
        result["consecutive_high_aqi_hours"] = result.groupby("city", sort=False)[
            "aqi_above_100"
        ].transform(lambda x: _streak(x.astype(bool)))

    if "high_pm25" in result:
        result["consecutive_high_pm25_hours"] = result.groupby("city", sort=False)[
            "high_pm25"
        ].transform(lambda x: _streak(x.astype(bool)))

    return result
