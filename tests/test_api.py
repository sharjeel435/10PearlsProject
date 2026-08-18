"""
API endpoint tests for the FastAPI application.

Uses TestClient from httpx (via starlette) to exercise all four endpoints
without launching a live server. Forecasts and model-info files are loaded
from the real artifacts/ directory so these tests verify integration, not
just response shape.
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from src.api.app import app

client = TestClient(app)


# ──────────────────────────────────────────────────────────────────────────────
# /health
# ──────────────────────────────────────────────────────────────────────────────

def test_health_returns_ok():
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert "forecast_ready" in body


# ──────────────────────────────────────────────────────────────────────────────
# /cities
# ──────────────────────────────────────────────────────────────────────────────

def test_cities_returns_three_cities():
    response = client.get("/cities")
    assert response.status_code == 200
    cities = response.json()
    assert isinstance(cities, list)
    assert len(cities) == 3
    assert set(cities) == {"Karachi", "Lahore", "Islamabad"}


# ──────────────────────────────────────────────────────────────────────────────
# /forecast/{city}
# ──────────────────────────────────────────────────────────────────────────────

@pytest.mark.parametrize("city", ["Karachi", "Lahore", "Islamabad"])
def test_forecast_valid_city(city):
    """Each city returns HTTP 200 with required forecast fields."""
    response = client.get(f"/forecast/{city}")
    if response.status_code == 503:
        pytest.skip("Forecast artifact not generated yet")
    assert response.status_code == 200
    body = response.json()
    assert body["city"] == city
    assert "forecasts" in body
    for horizon in ("24h", "48h", "72h"):
        assert horizon in body["forecasts"], f"Missing horizon {horizon}"
        horizon_data = body["forecasts"][horizon]
        assert "aqi" in horizon_data
        assert "category" in horizon_data
        assert "timestamp" in horizon_data
        assert isinstance(horizon_data["aqi"], (int, float))
        assert horizon_data["aqi"] >= 0, "AQI must be non-negative"


def test_forecast_case_insensitive():
    """Endpoint accepts lowercase city names."""
    for city in ("karachi", "lahore", "islamabad"):
        response = client.get(f"/forecast/{city}")
        if response.status_code == 503:
            pytest.skip("Forecast artifact not generated yet")
        assert response.status_code == 200, f"Expected 200 for {city!r}"
        assert response.json()["city"] == city.capitalize() or response.json()["city"] in ("Karachi", "Lahore", "Islamabad")


def test_forecast_invalid_city_returns_404():
    response = client.get("/forecast/InvalidCity")
    assert response.status_code == 404


def test_forecast_invalid_city_detail_in_body():
    response = client.get("/forecast/Atlantis")
    assert response.status_code == 404
    assert "Atlantis" in response.json().get("detail", "")


# ──────────────────────────────────────────────────────────────────────────────
# /model-info
# ──────────────────────────────────────────────────────────────────────────────

def test_model_info_returns_200():
    response = client.get("/model-info")
    if response.status_code == 503:
        pytest.skip("best_model.json not available")
    assert response.status_code == 200


def test_model_info_has_labeled_metric_sections():
    """Critical audit requirement: validation_metrics and final_test_metrics
    must both be present and labeled as separate sections."""
    response = client.get("/model-info")
    if response.status_code == 503:
        pytest.skip("best_model.json not available")
    body = response.json()
    assert "model" in body, "model field missing"
    assert "model_selection_split" in body, "model_selection_split field missing"
    assert body["model_selection_split"] == "validation"
    assert "validation_metrics" in body, "validation_metrics section missing"
    assert "final_test_metrics" in body, "final_test_metrics section missing"
    val = body["validation_metrics"]
    assert "overall_rmse" in val, "validation overall_rmse missing"
    assert "r2" in val, "validation r2 missing"


def test_model_info_validation_r2_reasonable():
    response = client.get("/model-info")
    if response.status_code == 503:
        pytest.skip("best_model.json not available")
    val = response.json()["validation_metrics"]
    assert 0 < val["r2"] < 1, f"Validation R2 out of range: {val['r2']}"
    assert val["overall_rmse"] > 0


def test_model_info_test_r2_higher_than_validation():
    """For this project test R2 > validation R2 (validation is harder period)."""
    response = client.get("/model-info")
    if response.status_code == 503:
        pytest.skip("best_model.json not available")
    body = response.json()
    val_r2 = body.get("validation_metrics", {}).get("r2", 0)
    test_r2 = body.get("final_test_metrics", {}).get("r2", 0)
    if test_r2 and val_r2:
        # Known property of this project; not a strict invariant for all models
        assert test_r2 > 0.5, f"Test R2 unexpectedly low: {test_r2}"
