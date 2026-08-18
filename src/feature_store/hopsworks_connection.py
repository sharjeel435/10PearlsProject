import os
import tempfile
from pathlib import Path

from config.settings import SETTINGS


def connect():
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        pass
    api_key = os.getenv("HOPSWORKS_API_KEY")
    if not api_key:
        raise RuntimeError("HOPSWORKS_API_KEY is not set")
    try:
        import hopsworks
    except ImportError as exc:
        raise RuntimeError("Install the 'hopsworks' optional dependency") from exc
    # Never log, interpolate, or persist api_key.
    cert_folder = Path(tempfile.gettempdir()) / "pearls-aqi-hopsworks-certs"
    cert_folder.mkdir(parents=True, exist_ok=True)
    return hopsworks.login(
        project=SETTINGS.hopsworks_project,
        api_key_value=api_key,
        cert_folder=str(cert_folder),
    )
