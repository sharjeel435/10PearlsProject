from __future__ import annotations
import logging, shutil, threading
from dataclasses import dataclass
from pathlib import Path
from config.settings import SETTINGS, Settings
from src.prediction.predictor import file_sha256

LOG = logging.getLogger(__name__)
MODEL_FILE = "model.joblib"

@dataclass(frozen=True)
class LoadedModel:
    bundle: dict
    name: str
    version: int
    sha256: str
    path: Path

class ModelLoader:
    """Download a pinned or latest Hopsworks model, verify it, and cache it."""
    def __init__(self, settings: Settings = SETTINGS):
        self.settings, self._loaded, self._lock = settings, None, threading.Lock()
    @property
    def ready(self): return self._loaded is not None
    @property
    def loaded(self): return self._loaded
    def load(self) -> LoadedModel:
        if self._loaded: return self._loaded
        with self._lock:
            if self._loaded: return self._loaded
            model_path, version = self._resolve_model_path()
            digest = self._expected_digest(model_path)
            actual = file_sha256(model_path)
            if actual.lower() != digest.lower(): raise RuntimeError("Model artifact integrity verification failed")
            import joblib
            bundle = joblib.load(model_path)
            if not isinstance(bundle, dict) or not {"model", "feature_columns"} <= bundle.keys():
                raise RuntimeError("Model bundle is missing required entries")
            self._loaded = LoadedModel(bundle, self.settings.model_name, version, actual, model_path)
            LOG.info("Model loaded: name=%s version=%s", self.settings.model_name, version)
            return self._loaded
    def _cache_root(self):
        root = self.settings.model_cache_dir.expanduser().resolve(); root.mkdir(parents=True, exist_ok=True); return root
    def _resolve_model_path(self):
        version = self.settings.model_version
        local = SETTINGS.artifacts_dir / self.settings.model_name / MODEL_FILE
        if version is not None:
            target = self._cache_root() / self.settings.model_name / str(version)
            cached = target / MODEL_FILE
            if cached.is_file(): return cached.resolve(), version
        if local.is_file() and version is not None:
            target.mkdir(parents=True, exist_ok=True); shutil.copy2(local, cached)
            sidecar = local.with_suffix(local.suffix + ".sha256")
            if sidecar.is_file(): shutil.copy2(sidecar, cached.with_suffix(cached.suffix + ".sha256"))
            return cached.resolve(), version
        return self._download(version)
    def _download(self, version):
        from src.feature_store.hopsworks_connection import connect
        registry = connect().get_model_registry()
        if version is None:
            models = registry.get_models(self.settings.model_name)
            if not models:
                raise RuntimeError(f"No registered model found: {self.settings.model_name}")
            remote = max(models, key=lambda model: int(model.version))
            version = int(remote.version)
        else:
            remote = registry.get_model(self.settings.model_name, version=version)
        if remote is None:
            raise RuntimeError(f"Registered model not found: {self.settings.model_name} v{version}")
        target = self._cache_root() / self.settings.model_name / str(version)
        cached = target / MODEL_FILE
        if cached.is_file(): return cached.resolve(), version
        LOG.info("Downloading model: name=%s version=%s", self.settings.model_name, version)
        downloaded = Path(remote.download()).resolve(); candidates = list(downloaded.rglob(MODEL_FILE))
        if len(candidates) != 1: raise RuntimeError(f"Expected exactly one {MODEL_FILE} in registry artifact")
        target.mkdir(parents=True, exist_ok=True); destination = target / MODEL_FILE
        source = candidates[0]
        shutil.copy2(source, destination)
        source_sidecar = source.with_suffix(source.suffix + ".sha256")
        if source_sidecar.is_file():
            shutil.copy2(source_sidecar, destination.with_suffix(destination.suffix + ".sha256"))
        return destination.resolve(), version
    def _expected_digest(self, model_path):
        digest = self.settings.model_sha256; sidecar = model_path.with_suffix(model_path.suffix + ".sha256")
        if not digest and sidecar.is_file(): digest = sidecar.read_text(encoding="ascii").strip()
        if not digest: raise RuntimeError("MODEL_SHA256 is required for a downloaded model")
        if len(digest) != 64 or any(c not in "0123456789abcdefABCDEF" for c in digest):
            raise RuntimeError("Configured model digest is not a valid SHA-256 value")
        return digest

MODEL_LOADER = ModelLoader()
