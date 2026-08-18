"""Export small, non-secret presentation datasets for the public web application."""
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "processed" / "aqi_features_full.parquet"
OUTPUT = ROOT / "artifacts"


def main() -> None:
    columns = ["city", "timestamp", "us_aqi", "pm2_5"]
    frame = pd.read_parquet(SOURCE, columns=columns)
    frame["timestamp"] = pd.to_datetime(frame["timestamp"], utc=True)
    cutoff = frame["timestamp"].max() - pd.Timedelta(days=30)
    recent = frame[frame.timestamp >= cutoff].copy()
    recent["date"] = recent.timestamp.dt.floor("D")
    daily = recent.groupby(["city", "date"], as_index=False)[["us_aqi", "pm2_5"]].mean()
    daily.to_json(OUTPUT / "historical_daily_30d.json", orient="records", date_format="iso", indent=2)
    print(f"Exported {len(daily)} daily city observations through {frame.timestamp.max()}")


if __name__ == "__main__":
    main()
