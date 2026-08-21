from pathlib import Path
import joblib

from config.settings import Settings
from src.api.app import parse_allowed_origins
from src.model_serving.model_loader import ModelLoader
from src.prediction.predictor import write_artifact_digest

def test_allowed_origins_are_trimmed_deduplicated_and_no_wildcard():
    assert parse_allowed_origins("http://localhost:3000/, https://pearls.vercel.app,*,http://localhost:3000") == [
        "http://localhost:3000", "https://pearls.vercel.app"]

def test_unrelated_origin_is_not_implicitly_allowed():
    assert "https://evil.example" not in parse_allowed_origins("https://pearls.vercel.app")

def test_model_configuration_is_version_pinned(monkeypatch, tmp_path: Path):
    monkeypatch.setenv("MODEL_VERSION", "7"); monkeypatch.setenv("MODEL_CACHE_DIR", str(tmp_path))
    settings = Settings()
    assert settings.model_version == 7
    assert ModelLoader(settings)._cache_root() == tmp_path.resolve()

def test_model_configuration_accepts_latest(monkeypatch):
    monkeypatch.setenv("MODEL_VERSION", "latest")
    assert Settings().model_version is None


def test_model_configuration_remains_pinned_by_default(monkeypatch):
    monkeypatch.delenv("MODEL_VERSION", raising=False)
    assert Settings().model_version == 1


def test_loader_selects_latest_registry_version_and_uses_its_digest(monkeypatch, tmp_path):
    remote_dirs = {}
    for version in (2, 4):
        directory = tmp_path / f"remote-{version}"
        directory.mkdir()
        model_path = directory / "model.joblib"
        joblib.dump({"model": f"model-v{version}", "feature_columns": ["us_aqi"]}, model_path)
        write_artifact_digest(model_path)
        remote_dirs[version] = directory

    class RemoteModel:
        def __init__(self, version):
            self.version = version

        def download(self):
            return str(remote_dirs[self.version])

    class Registry:
        def get_models(self, name):
            assert name == "aqi_random_forest"
            return [RemoteModel(2), RemoteModel(4)]

    class Project:
        def get_model_registry(self):
            return Registry()

    monkeypatch.setattr("src.feature_store.hopsworks_connection.connect", lambda: Project())
    settings = Settings(model_version=None, model_cache_dir=tmp_path / "cache")

    loaded = ModelLoader(settings).load()

    assert loaded.version == 4
    assert loaded.bundle["model"] == "model-v4"
    assert loaded.path == (tmp_path / "cache" / "aqi_random_forest" / "4" / "model.joblib").resolve()
