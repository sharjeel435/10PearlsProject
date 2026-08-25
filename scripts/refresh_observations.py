"""
Standalone script to refresh latest_observations.json from Open-Meteo.
Does NOT require Hopsworks. Uses the same OpenMeteoClient as the main pipeline.
Run: python scripts/refresh_observations.py
"""
import json
import sys
from datetime import date, timedelta, timezone, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from config.cities import CITIES
from config.settings import AIR_QUALITY_VARIABLES, WEATHER_VARIABLES
from src.data.cleaner import clean_observations, merge_weather_air_quality
from src.data.openmeteo_client import OpenMeteoClient


def main() -> None:
    client = OpenMeteoClient()
    end   = date.today()
    start = end - timedelta(days=3)  # 3-day lookback for latest complete hour

    rows = []
    for city in CITIES:
        try:
            weather = client.fetch_historical(city, start, end, WEATHER_VARIABLES, "weather")
            air     = client.fetch_historical(city, start, end, AIR_QUALITY_VARIABLES, "air_quality")
            merged  = merge_weather_air_quality(weather, air)
            clean, _ = clean_observations(merged)
            # Pick the most recent non-null US AQI row
            valid = clean[clean["us_aqi"].notna()].sort_values("timestamp")
            if valid.empty:
                print(f"  ⚠  No valid AQI rows for {city.name}")
                continue
            latest = valid.iloc[-1]
            row = {
                "city":                  city.name,
                "timestamp":             latest["timestamp"].isoformat(),
                "us_aqi":                round(float(latest.get("us_aqi", 0)), 1),
                "pm2_5":                 round(float(latest.get("pm2_5",  0) or 0), 1),
                "pm10":                  round(float(latest.get("pm10",   0) or 0), 1),
                "nitrogen_dioxide":      round(float(latest.get("nitrogen_dioxide",  0) or 0), 1),
                "sulphur_dioxide":       round(float(latest.get("sulphur_dioxide",   0) or 0), 1),
                "carbon_monoxide":       round(float(latest.get("carbon_monoxide",   0) or 0), 1),
                "ozone":                 round(float(latest.get("ozone",             0) or 0), 1),
                "temperature_2m":        round(float(latest.get("temperature_2m",   0) or 0), 1),
                "relative_humidity_2m":  round(float(latest.get("relative_humidity_2m", 0) or 0), 1),
                "wind_speed_10m":        round(float(latest.get("wind_speed_10m",    0) or 0), 1),
                "wind_direction_10m":    int(latest.get("wind_direction_10m", 0) or 0),
                "surface_pressure":      round(float(latest.get("surface_pressure",  0) or 0), 1),
                "precipitation":         round(float(latest.get("precipitation",     0) or 0), 1),
            }
            rows.append(row)
            print(f"  OK {city.name}: AQI={row['us_aqi']} @ {row['timestamp']}")
        except Exception as exc:
            print(f"  WARN {city.name}: {exc}")

    if not rows:
        print("No rows produced -- aborting update.")
        sys.exit(1)

    out_path = ROOT / "artifacts" / "latest_observations.json"
    out_path.write_text(json.dumps(rows, indent=2), encoding="utf-8")
    print(f"\nDone. Written {len(rows)} cities to {out_path}")



if __name__ == "__main__":
    main()
