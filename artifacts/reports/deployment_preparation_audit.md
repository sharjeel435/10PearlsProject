# Deployment preparation audit

| Item | Verified value |
|---|---|
| FastAPI app | `src.api.app:app` |
| Backend root/build/start | repository root / `pip install -r requirements-prod.txt` / `uvicorn src.api.app:app --host 0.0.0.0 --port $PORT` |
| Python | 3.12 (`runtime.txt`; production dependency range compatible with serialized sklearn 1.5.2 model) |
| Frontend | `dashboard-next`; npm lockfile; `npm ci`; `npm run build` |
| Model | `aqi_random_forest`, Hopsworks version 1, local measured size 498,061,822 bytes |
| Download/cache | pinned registry lookup; `.model-cache` default; configurable persistent disk |
| Integrity | exact file, trusted cache path, required SHA-256 before `joblib.load` |
| CORS/health | exact environment origins; optional scoped regex; `/health` is local-only |
| Render/Vercel | `render.yaml` plus exact guides; Vercel uses framework defaults |

Required backend variables are documented in `docs/deployment/render-env.md`; frontend uses only `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_SITE_URL`. Remaining manual actions: provide secrets/digest and deployment-created URLs, deploy Render then Vercel, configure final CORS, and run smoke tests. Persistent disk: **RECOMMENDED** due to the 475 MiB cold download.
