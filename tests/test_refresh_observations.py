"""
Tests for scripts/refresh_observations.py

Tests that the observation refresh script:
1. Fetches data via OpenMeteoClient and produces the correct JSON schema
2. Picks the most recent row with a valid AQI (skips nulls)
3. Writes all numeric fields rounded to 1 decimal place
4. Handles a city with no valid AQI rows gracefully (skips it, doesn't crash)
5. Writes output only when at least one city succeeds
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pandas as pd
import pytest

# Ensure the repo root is importable
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _make_obs_frame(city: str, us_aqi_values: list[float | None]) -> pd.DataFrame:
    """Build a minimal merged observations frame for a single city."""
    n = len(us_aqi_values)
    return pd.DataFrame({
        "city":                  city,
        "timestamp":             pd.date_range("2026-08-22", periods=n, freq="h", tz="UTC"),
        "us_aqi":                us_aqi_values,
        "pm2_5":                 [22.0] * n,
        "pm10":                  [45.0] * n,
        "nitrogen_dioxide":      [12.3] * n,
        "sulphur_dioxide":       [5.0] * n,
        "carbon_monoxide":       [300.0] * n,
        "ozone":                 [40.0] * n,
        "temperature_2m":        [28.0] * n,
        "relative_humidity_2m":  [75.0] * n,
        "wind_speed_10m":        [8.5] * n,
        "wind_direction_10m":    [180] * n,
        "surface_pressure":      [1005.5] * n,
        "precipitation":         [0.0] * n,
    })


# ─── Tests ───────────────────────────────────────────────────────────────────

class TestRefreshObservations:

    def _run_main(self, merged_frames: dict[str, pd.DataFrame], tmp_path: Path) -> list[dict]:
        """
        Invoke scripts.refresh_observations.main() with mocked dependencies.

        Parameters
        ----------
        merged_frames : city_name -> DataFrame that merge_weather_air_quality returns
        tmp_path      : pytest temporary directory used as artifacts output
        """
        # Patch at the module level where the names are actually used
        target = "scripts.refresh_observations"

        city_objects = [SimpleNamespace(name=name) for name in merged_frames]

        def fake_fetch_historical(city, *_args, **_kwargs):
            return merged_frames[city.name]

        def fake_merge(w, a):
            # Return whichever frame was passed as weather (they're the same in our mock)
            return w

        def fake_clean(frame):
            return frame, {}

        def fake_validate(*_a, **_kw):
            pass

        mock_client = MagicMock()
        mock_client.fetch_historical.side_effect = fake_fetch_historical

        out_file = tmp_path / "latest_observations.json"

        with (
            patch(f"{target}.CITIES", city_objects),
            patch(f"{target}.OpenMeteoClient", return_value=mock_client),
            patch(f"{target}.merge_weather_air_quality", side_effect=fake_merge),
            patch(f"{target}.clean_observations", side_effect=fake_clean),
            patch("pathlib.Path.write_text", MagicMock()),   # intercept file write
        ):
            # Redirect artifacts path so we can inspect the written JSON
            with patch(f"{target}.ROOT", tmp_path):
                # Ensure artifacts dir exists
                (tmp_path / "artifacts").mkdir(exist_ok=True)
                import importlib
                import scripts.refresh_observations as mod  # noqa: PLC0415
                importlib.reload(mod)
                mod.ROOT = tmp_path
                mod.main()

        out = tmp_path / "artifacts" / "latest_observations.json"
        if out.exists():
            return json.loads(out.read_text())
        return []

    # ------------------------------------------------------------------
    def test_schema_and_rounding(self, tmp_path: Path):
        """Output rows must have all required keys and 1-decimal rounding."""
        frames = {
            "Karachi": _make_obs_frame("Karachi", [None, 71.47]),
        }

        import importlib
        import scripts.refresh_observations as mod
        importlib.reload(mod)
        mod.ROOT = tmp_path
        (tmp_path / "artifacts").mkdir(exist_ok=True)

        city_objects = [SimpleNamespace(name="Karachi")]
        mock_client = MagicMock()
        mock_client.fetch_historical.return_value = frames["Karachi"]

        with (
            patch("scripts.refresh_observations.CITIES", city_objects),
            patch("scripts.refresh_observations.OpenMeteoClient", return_value=mock_client),
            patch("scripts.refresh_observations.merge_weather_air_quality", return_value=frames["Karachi"]),
            patch("scripts.refresh_observations.clean_observations", return_value=(frames["Karachi"], {})),
        ):
            mod.main()

        rows = json.loads((tmp_path / "artifacts" / "latest_observations.json").read_text())

        assert len(rows) == 1
        row = rows[0]

        required_keys = {
            "city", "timestamp", "us_aqi", "pm2_5", "pm10",
            "nitrogen_dioxide", "sulphur_dioxide", "carbon_monoxide",
            "ozone", "temperature_2m", "relative_humidity_2m",
            "wind_speed_10m", "wind_direction_10m",
            "surface_pressure", "precipitation",
        }
        assert required_keys.issubset(row.keys()), f"Missing keys: {required_keys - row.keys()}"

        # us_aqi should be the latest non-null row (index 1 = 71.47 → rounded 71.5)
        assert row["us_aqi"] == 71.5
        assert row["city"] == "Karachi"

    # ------------------------------------------------------------------
    def test_picks_most_recent_valid_aqi(self, tmp_path: Path):
        """When multiple rows exist, the most recent non-null AQI row is used."""
        import importlib
        import scripts.refresh_observations as mod
        importlib.reload(mod)
        mod.ROOT = tmp_path
        (tmp_path / "artifacts").mkdir(exist_ok=True)

        frame = _make_obs_frame("Lahore", [50.0, 80.0, None, 120.0, None])
        # Most recent non-null: index 3 → us_aqi=120.0

        city_objects = [SimpleNamespace(name="Lahore")]
        mock_client = MagicMock()
        mock_client.fetch_historical.return_value = frame

        with (
            patch("scripts.refresh_observations.CITIES", city_objects),
            patch("scripts.refresh_observations.OpenMeteoClient", return_value=mock_client),
            patch("scripts.refresh_observations.merge_weather_air_quality", return_value=frame),
            patch("scripts.refresh_observations.clean_observations", return_value=(frame, {})),
        ):
            mod.main()

        rows = json.loads((tmp_path / "artifacts" / "latest_observations.json").read_text())
        assert rows[0]["us_aqi"] == 120.0

    # ------------------------------------------------------------------
    def test_skips_city_with_all_null_aqi(self, tmp_path: Path, capsys):
        """A city with no valid AQI rows is skipped; other cities still succeed."""
        import importlib
        import scripts.refresh_observations as mod
        importlib.reload(mod)
        mod.ROOT = tmp_path
        (tmp_path / "artifacts").mkdir(exist_ok=True)

        good_frame = _make_obs_frame("Islamabad", [95.0])
        bad_frame  = _make_obs_frame("Karachi",   [None])   # all nulls

        city_objects = [
            SimpleNamespace(name="Islamabad"),
            SimpleNamespace(name="Karachi"),
        ]
        mock_client = MagicMock()
        call_count = [0]

        def side_effect(city, *_a, **_kw):
            call_count[0] += 1
            return good_frame if city.name == "Islamabad" else bad_frame

        mock_client.fetch_historical.side_effect = side_effect

        def fake_clean(frame):
            return frame, {}

        with (
            patch("scripts.refresh_observations.CITIES", city_objects),
            patch("scripts.refresh_observations.OpenMeteoClient", return_value=mock_client),
            patch("scripts.refresh_observations.merge_weather_air_quality", side_effect=lambda w, _: w),
            patch("scripts.refresh_observations.clean_observations", side_effect=fake_clean),
        ):
            mod.main()

        rows = json.loads((tmp_path / "artifacts" / "latest_observations.json").read_text())
        cities_in_output = {r["city"] for r in rows}
        assert "Islamabad" in cities_in_output
        assert "Karachi" not in cities_in_output   # skipped gracefully

    # ------------------------------------------------------------------
    def test_three_cities_all_produce_rows(self, tmp_path: Path):
        """Happy-path: all three cities produce exactly one row each."""
        import importlib
        import scripts.refresh_observations as mod
        importlib.reload(mod)
        mod.ROOT = tmp_path
        (tmp_path / "artifacts").mkdir(exist_ok=True)

        city_names = ["Karachi", "Lahore", "Islamabad"]
        aqi_values = {"Karachi": 92.0, "Lahore": 162.0, "Islamabad": 120.0}

        frames = {c: _make_obs_frame(c, [aqi_values[c]]) for c in city_names}
        city_objects = [SimpleNamespace(name=c) for c in city_names]
        mock_client = MagicMock()
        mock_client.fetch_historical.side_effect = lambda city, *a, **kw: frames[city.name]

        with (
            patch("scripts.refresh_observations.CITIES", city_objects),
            patch("scripts.refresh_observations.OpenMeteoClient", return_value=mock_client),
            patch("scripts.refresh_observations.merge_weather_air_quality", side_effect=lambda w, _: w),
            patch("scripts.refresh_observations.clean_observations", side_effect=lambda f: (f, {})),
        ):
            mod.main()

        rows = json.loads((tmp_path / "artifacts" / "latest_observations.json").read_text())
        assert len(rows) == 3
        by_city = {r["city"]: r for r in rows}
        for city, expected_aqi in aqi_values.items():
            assert by_city[city]["us_aqi"] == expected_aqi
