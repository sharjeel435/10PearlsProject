from __future__ import annotations

import json

import pandas as pd
import streamlit as st

from config.cities import CITIES
from config.settings import SETTINGS

st.set_page_config(page_title="Pearls AQI Predictor", page_icon="🫧", layout="wide")
st.title("Pearls AQI Predictor")
st.caption("Three-day air-quality outlook for Pakistan")

forecast_path = SETTINGS.artifacts_dir / "latest_forecasts.json"
if not forecast_path.exists():
    st.warning("No forecast artifact is available. Run `python -m scripts.predict --latest`.")
    st.stop()

forecasts = pd.DataFrame(json.loads(forecast_path.read_text(encoding="utf-8")))
city = st.selectbox("City", [x.name for x in CITIES])
row = forecasts[forecasts.city == city]
if row.empty:
    st.error(f"No forecast is available for {city}."); st.stop()
row = row.iloc[0]
cols = st.columns(3)
for column, horizon in zip(cols, (24, 48, 72)):
    column.metric(f"AQI +{horizon}h", f"{row[f'predicted_aqi_{horizon}h']:.0f}", row[f'category_{horizon}h'])
st.subheader("Forecast trend")
st.line_chart(pd.DataFrame({"AQI": [row[f"predicted_aqi_{h}h"] for h in (24, 48, 72)]}, index=["24h", "48h", "72h"]))
st.caption(f"Model: {row['model']} v{row.get('model_version', 1)} · Generated: {row['generated_at']}")

