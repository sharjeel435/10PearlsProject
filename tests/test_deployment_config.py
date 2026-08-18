from pathlib import Path
from config.settings import Settings
from src.api.app import parse_allowed_origins
from src.model_serving.model_loader import ModelLoader

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
