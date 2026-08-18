# ── Hugging Face Spaces — Pearls AQI FastAPI Backend ─────────────────────────
# Base image: slim Python 3.12, matches runtime.txt
FROM python:3.12-slim

# --------------------------------------------------------------------------- #
# System packages needed by scientific Python stack and hopsworks client
# --------------------------------------------------------------------------- #
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        curl \
        libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# --------------------------------------------------------------------------- #
# Create a non-root user (HF Spaces best-practice)
# --------------------------------------------------------------------------- #
RUN useradd -m -u 1000 appuser

WORKDIR /app

# --------------------------------------------------------------------------- #
# Copy only the dependency definition files first (layer-cache optimisation)
# --------------------------------------------------------------------------- #
COPY pyproject.toml ./
COPY requirements-prod.txt ./

# --------------------------------------------------------------------------- #
# Install production extras: FastAPI + Uvicorn + Hopsworks client
# The model (~498 MB) is NOT bundled — it is downloaded from Hopsworks on
# first startup and persisted to MODEL_CACHE_DIR.
# --------------------------------------------------------------------------- #
RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir -e ".[app,hopsworks]"

# --------------------------------------------------------------------------- #
# Copy the rest of the application source
# (heavy paths excluded via .dockerignore)
# --------------------------------------------------------------------------- #
COPY config/    config/
COPY src/       src/
COPY api/       api/
COPY artifacts/ artifacts/

# --------------------------------------------------------------------------- #
# Create writable model cache directory and hand ownership to appuser
# --------------------------------------------------------------------------- #
RUN mkdir -p /app/.model-cache && chown -R appuser:appuser /app

USER appuser

# --------------------------------------------------------------------------- #
# Environment defaults — override all of these via HF Spaces secrets/settings
# --------------------------------------------------------------------------- #
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    MODEL_CACHE_DIR=/app/.model-cache \
    MODEL_NAME=aqi_random_forest \
    MODEL_VERSION=1 \
    HOPSWORKS_PROJECT=DataProject \
    LOG_LEVEL=INFO \
    LOAD_MODEL_ON_STARTUP=1

# HF Spaces requires port 7860
EXPOSE 7860

# --------------------------------------------------------------------------- #
# Health check — HF Spaces polls this path
# --------------------------------------------------------------------------- #
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
    CMD curl -f http://localhost:7860/health || exit 1

# --------------------------------------------------------------------------- #
# Entrypoint
# --------------------------------------------------------------------------- #
CMD ["uvicorn", "src.api.app:app", "--host", "0.0.0.0", "--port", "7860", "--workers", "1"]
