import numpy as np
import pandas as pd
import pytest

from src.features.feature_engineering import create_targets, engineer_features
from src.features.quality import audit_features
from src.prediction.categories import aqi_category
from src.prediction.predictor import load_sklearn_bundle
from src.training.lstm_trainer import make_sequences


@pytest.mark.parametrize(("aqi", "category"), [(0, "Good"), (51, "Moderate"), (101, "Unhealthy for Sensitive Groups"),
                                                   (151, "Unhealthy"), (201, "Very Unhealthy"), (301, "Hazardous")])
def test_aqi_categories(aqi, category):
    assert aqi_category(aqi) == category


def test_quality_filter_excludes_constant_and_targets(observations):
    frame = engineer_features(observations)
    frame["constant_test"] = 1
    selected, report = audit_features(frame)
    assert len(selected) >= 100
    assert "constant_test" not in selected
    assert not any(name.startswith("target_") for name in selected)
    assert report.loc[report.feature_name == "constant_test", "reason_if_excluded"].iloc[0] == "constant"


def test_lstm_sequences_never_cross_city(observations):
    observations = create_targets(observations.copy())
    features = ["us_aqi", "pm2_5"]
    seq, _, cities, _ = make_sequences(observations, features, 24)
    assert len(seq) == 2 * (240 - 72 - 23)
    assert np.all(seq[cities == "Karachi"][:, :, 0] < 1000)
    assert np.all(seq[cities == "Lahore"][:, :, 0] < 300)  # AQI fixture wraps at 300
    assert np.all(seq[cities == "Lahore"][:, :, 1] >= 1020)


def test_joblib_loader_rejects_untrusted_path(tmp_path):
    path = tmp_path / "model.joblib"; path.write_bytes(b"not-a-model")
    with pytest.raises(ValueError, match="trusted artifacts"):
        load_sklearn_bundle(path, expected_sha256="0" * 64)
