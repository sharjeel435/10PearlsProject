# Render environment variables

| Name | Secret | Required | Value / purpose |
|---|---:|---:|---|
| `HOPSWORKS_API_KEY` | Yes | Yes | Model Registry read access; enter in Render only. |
| `HOPSWORKS_PROJECT` | No | Yes | `DataProject` |
| `MODEL_NAME` | No | Yes | `aqi_random_forest` |
| `MODEL_VERSION` | No | Yes | `1`; explicitly pinned. |
| `MODEL_SHA256` | Integrity value | Yes | Copy the 64-character trusted digest from model metadata; never guess. |
| `MODEL_CACHE_DIR` | No | Yes | `/opt/render/project/src/.model-cache`, or `/var/data/models` with a disk. |
| `ALLOWED_ORIGINS` | No | Yes | Comma-separated exact frontend origins; initially `http://localhost:3000`, then add the Vercel URL. |
| `ALLOWED_ORIGIN_REGEX` | No | No | Controlled team/project-specific Vercel preview regex. Do not use a broad `.*vercel.app`. |
| `LOG_LEVEL` | No | No | `INFO` |
| `LOAD_MODEL_ON_STARTUP` | No | No | `1` (default); startup fails clearly if the trusted model cannot load. |

These are backend runtime variables. None belongs in Vercel or the browser bundle.
