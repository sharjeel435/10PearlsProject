"""
Model reload and inference tests.

These tests independently reload the trained artifacts from disk and
verify that inference produces valid outputs, closing the audit gap
identified in M3: 'No automated test for actual model reload'.
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
import pytest

from config.settings import SETTINGS

RF_DIR = SETTINGS.artifacts_dir / "aqi_random_forest"
RIDGE_DIR = SETTINGS.artifacts_dir / "aqi_ridge"
LSTM_DIR = SETTINGS.artifacts_dir / "aqi_lstm"


def _rf_columns():
    """Load RF feature columns from saved bundle."""
    import joblib
    bundle = joblib.load(RF_DIR / "model.joblib")
    return bundle["feature_columns"]


@pytest.mark.skipif(not (RF_DIR / "model.joblib").is_file(), reason="RF artifact not trained yet")
class TestRandomForestReload:
    def test_rf_bundle_loads(self):
        """load_sklearn_bundle can reload the RF without error."""
        from src.prediction.predictor import load_sklearn_bundle
        sha_path = RF_DIR / "model.joblib.sha256"
        expected = sha_path.read_text(encoding="utf-8").strip() if sha_path.exists() else None
        bundle = load_sklearn_bundle(RF_DIR / "model.joblib", expected_sha256=expected)
        assert "model" in bundle
        assert "feature_columns" in bundle

    def test_rf_inference_returns_three_outputs(self):
        """RF pipeline.predict() returns an array with shape (n_samples, 3)."""
        import joblib
        import pandas as pd
        bundle = joblib.load(RF_DIR / "model.joblib")
        model = bundle["model"]
        columns = bundle["feature_columns"]
        # Build synthetic rows with valid city strings; other cols are zeros
        X = pd.DataFrame(np.zeros((3, len(columns))), columns=columns)
        if "city" in columns:
            X["city"] = "Karachi"
        predictions = model.predict(X)
        assert predictions.shape == (3, 3), f"Expected (3, 3), got {predictions.shape}"

    def test_rf_predictions_are_finite(self):
        """RF predictions on synthetic input must be finite."""
        import joblib
        import pandas as pd
        bundle = joblib.load(RF_DIR / "model.joblib")
        X = pd.DataFrame(
            np.zeros((5, len(bundle["feature_columns"]))),
            columns=bundle["feature_columns"],
        )
        if "city" in bundle["feature_columns"]:
            X["city"] = "Lahore"
        preds = bundle["model"].predict(X)
        assert np.all(np.isfinite(preds)), "RF predictions contain NaN or Inf"


@pytest.mark.skipif(not (RIDGE_DIR / "model.joblib").is_file(), reason="Ridge artifact not trained yet")
class TestRidgeReload:
    def test_ridge_bundle_loads(self):
        from src.prediction.predictor import load_sklearn_bundle
        sha_path = RIDGE_DIR / "model.joblib.sha256"
        expected = sha_path.read_text(encoding="utf-8").strip() if sha_path.exists() else None
        bundle = load_sklearn_bundle(RIDGE_DIR / "model.joblib", expected_sha256=expected)
        assert "model" in bundle

    def test_ridge_inference_returns_three_outputs(self):
        import joblib
        import pandas as pd
        bundle = joblib.load(RIDGE_DIR / "model.joblib")
        X = pd.DataFrame(
            np.zeros((2, len(bundle["feature_columns"]))),
            columns=bundle["feature_columns"],
        )
        if "city" in bundle["feature_columns"]:
            X["city"] = "Islamabad"
        predictions = bundle["model"].predict(X)
        assert predictions.shape == (2, 3)


@pytest.mark.skipif(
    not (LSTM_DIR / "model.keras").is_file()
    or not (LSTM_DIR / "preprocessing.joblib").is_file(),
    reason="LSTM artifact not trained yet",
)
class TestLSTMReload:
    def test_lstm_keras_model_loads(self):
        try:
            import tensorflow as tf  # noqa: F401
        except ImportError:
            pytest.skip("TensorFlow not installed")
        import joblib
        import tensorflow as tf
        model = tf.keras.models.load_model(LSTM_DIR / "model.keras")
        assert model is not None

    def test_lstm_preprocessing_loads(self):
        import joblib
        bundle = joblib.load(LSTM_DIR / "preprocessing.joblib")
        assert "scaler" in bundle
        assert "imputer" in bundle
        assert "sequence_length" in bundle
