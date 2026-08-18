# Pearls AQI deployment guide

## Architecture

Vercel serves `dashboard-next` over HTTPS. It calls the Render FastAPI application `src.api.app:app`. Render downloads pinned Random Forest version 1 from the Hopsworks Model Registry, verifies SHA-256, loads it once, and retains it in process memory. Forecast snapshots are marked `cached`; no request trains, downloads four years of data, or runs SHAP.

## Prerequisites and GitHub preparation

Use Python 3.12, Node 22, GitHub access, a Render account, a Vercel account, Hopsworks project `DataProject`, registry model `aqi_random_forest` version `1`, and its trusted SHA-256. Review `git status`; never add `.env`, `.model-cache`, datasets, or `*.joblib`. The small digest, metrics, manifests, and documentation may remain in Git. The user performs commit/push; this preparation does neither.

## Hopsworks model preparation

Confirm registry version 1 contains exactly one `model.joblib`, metadata, and the digest that matches the validated local artifact. Grant the Render key read-only access where possible. A future promotion is: train, validate, final-test, register a new version, manually change Render `MODEL_VERSION` and `MODEL_SHA256`, restart, then smoke-test. Never point production at “latest.”

## Render backend deployment

Follow [deployment/render-setup.md](deployment/render-setup.md) and [deployment/render-env.md](deployment/render-env.md). Root is the repository root; build is `pip install -r requirements-prod.txt`; start is `uvicorn src.api.app:app --host 0.0.0.0 --port $PORT`; health is `/health`. Startup checks local cache, otherwise downloads from Hopsworks, verifies model name/version/file/digest, then deserializes once. A persistent `/var/data/models` cache is recommended for the 498,061,822-byte model.

## Render health check and backend smoke test

`/health` is local and fast: no network, inference, download, training, or SHAP. Production is ready only when `model_ready` is true. Run:

```bash
python scripts/smoke_test_backend.py --base-url https://<render-domain>
```

This tests health, cities, all three forecasts, model info, and invalid-city handling.

## Vercel frontend deployment

Follow [deployment/vercel-setup.md](deployment/vercel-setup.md). Use root `dashboard-next`, `npm ci`, and `npm run build`. `NEXT_PUBLIC_API_BASE_URL` is normalized to prevent double slashes. Only `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_SITE_URL` are browser-public; never add Hopsworks or backend secrets.

## CORS and first production test

Deploy Render first, verify health, and copy its URL. Deploy Vercel with that URL, copy the Vercel URL, add the exact origin to Render `ALLOWED_ORIGINS`, restart Render, set Vercel `NEXT_PUBLIC_SITE_URL`, and rebuild. Test the browser console and every endpoint. Preview origins must be explicit or match a tightly scoped project/team regex, never `*`.

## Local system test

```powershell
$env:LOAD_MODEL_ON_STARTUP="0"
uvicorn src.api.app:app --host 127.0.0.1 --port 8000
cd dashboard-next
Copy-Item .env.example .env.local
npm ci
npm run dev
```

Open `http://localhost:3000`; test each city. Remove the startup override when validating the compatible Python 3.12 production model environment.

## Troubleshooting

- Render build: inspect Python version, root directory, dependency resolution, missing packages, and imports.
- Port: bind `0.0.0.0` and use `$PORT`.
- Registry download: check key, project, name, version, permissions, network, and cache permissions without logging credentials.
- Model load: check digest, corruption, missing preprocessor, feature manifest, and scikit-learn version. The artifact was serialized with 1.5.2; production pins `<1.6`.
- Memory or slow start: use Standard/larger instance and persistent cache. Select a smaller model only after legitimate validation; do not silently reduce quality.
- Vercel build: check root, Node version, environment values, TypeScript, and lockfile.
- CORS: compare exact protocol/domain in browser console, Render logs, and `ALLOWED_ORIGINS`; do not set `*`.
- Cached data: verify `NEXT_PUBLIC_API_BASE_URL`, rebuild after public-variable changes, and check backend health. Cached timestamps must not be described as current observations.

## Updates and rollback

For code: local tests, user commit/push, platform auto-deploy, smoke-test. For a model: register, update pinned version and digest, restart, smoke-test. Roll back frontend to a known-good Vercel deployment; roll back backend to a prior Render deploy or restore the prior `MODEL_VERSION` and digest. No code edit is needed for model rollback.

## Security and final checklist

- [ ] Render health reports `model_ready: true`
- [ ] All four API route families and invalid city pass smoke test
- [ ] Model is version-pinned, digest-verified, and absent from Git
- [ ] Frontend build/lint/tests pass and shows cached/error states honestly
- [ ] Exact production and preview CORS origins are configured
- [ ] No `.env`, API key, token, model binary, or private credential is staged
- [ ] No live deployment or push was performed during preparation
