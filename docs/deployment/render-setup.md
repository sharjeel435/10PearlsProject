# Render setup

Use **Web Service**, repository `sharjeel435/10PearlsProject`, branch `main`, Root Directory blank (repository root), Language **Python**, build command `pip install -r requirements-prod.txt`, start command `uvicorn src.api.app:app --host 0.0.0.0 --port $PORT`, and health path `/health`. Select a Standard instance initially because the 475 MiB model plus Python/scikit-learn memory is unsafe on the smallest tier. Auto Deploy after CI is recommended.

1. In Render choose **New > Web Service**, connect GitHub, and select the repository.
2. Enter the exact fields above (or apply `render.yaml`). Add every variable in [render-env.md](render-env.md).
3. Create the service and inspect dependency, registry-download, digest, and model-load logs. Logs intentionally omit credentials.
4. Wait for `/health` to return `model_ready: true`, then run `python scripts/smoke_test_backend.py --base-url https://<render-domain>`.
5. Test `/cities`, `/forecast/Karachi`, `/forecast/Lahore`, `/forecast/Islamabad`, and `/model-info`.

Persistent disk is **RECOMMENDED**: a 498,061,822-byte download materially affects cold starts. Mount `/var/data` and change only `MODEL_CACHE_DIR=/var/data/models`. The tradeoff is disk cost and one extra platform setting; without it, ephemeral caching still works per instance lifetime.

The checked-in forecast snapshots were generated from nine days (168-hour maximum feature history plus margin) of Open-Meteo archive weather and air-quality data. Runtime requests do not fetch four years, retrain, or run SHAP.
