import pandas as pd

from src.data.openmeteo_client import OpenMeteoClient, OpenMeteoError


def test_openmeteo_parser_is_utc_and_keeps_entity_fields():
    payload = {"hourly": {"time": ["2024-01-01T00:00"], "us_aqi": [42]}}
    frame = OpenMeteoClient._frame(payload, "Karachi", 24.86, 67.0)
    assert frame.loc[0, "city"] == "Karachi"
    assert str(frame.timestamp.dt.tz) == "UTC"


def test_chunking_has_no_overlap():
    from datetime import date
    chunks = list(OpenMeteoClient.chunks(date(2024, 1, 1), date(2024, 1, 10), 3))
    assert chunks[0] == (date(2024, 1, 1), date(2024, 1, 3))
    assert chunks[-1] == (date(2024, 1, 10), date(2024, 1, 10))
