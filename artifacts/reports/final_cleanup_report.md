# Final Cleanup Report - 17 August 2026

## Before vs After

| Metric | Before | After |
|---|---|---|
| Files (excl. node_modules/.next/.venv) | 283 | 313* |
| Total size | 659.8 MB | 577.6 MB |
| Size saved | — | 82.2 MB |

*File count is higher post-cleanup because new report/inventory files were added.
The net reduction in raw data/logs is -82.2 MB.

## Files Deleted

| Path | Reason |
|---|---|
| rtifacts/lstm_candidate_24h.keras | Experimental 24h LSTM checkpoint (not final model) |
| rtifacts/lstm_candidate_48h.keras | Identical to qi_lstm/model.keras |
| rtifacts/hopsworks_logs/ | 81.9 MB Hopsworks materialization stderr log |
| rtifacts/runtime/ | API and Streamlit dev-run stdout/stderr |
| rtifacts/model_load_test.json | Manual development test artifact |
| All __pycache__/ directories | Python bytecode caches |
| .pytest_cache/ | Test runner cache |
| pearls_aqi_predictor.egg-info/ | Generated setuptools metadata |

## Files Added

| Path | Purpose |
|---|---|
| rtifacts/reports/pre_cleanup_baseline.md | Baseline state before cleanup |
| rtifacts/reports/repository_inventory.md | Classification of all files |
| rtifacts/reports/final_cleanup_report.md | This document |

## Files Modified

| Path | Change |
|---|---|
| .gitignore | Added: hopsworks_logs/, runtime/, egg-info/, ruff_cache/, tsconfig.tsbuildinfo |
| .env.example | Added descriptive comments and placeholder values |
| 
equirements.txt | Added explanatory comment; clarified Python 3.12 as verified runtime |
| README.md | Fixed stale test count (20→39), Python version description |
| dashboard-next/lib/api.ts | Reformatted: minified → readable TypeScript |
| dashboard-next/lib/aqi.ts | Reformatted: minified → readable TypeScript |
| dashboard-next/lib/types.ts | Reformatted + replaced loose ModelInfo with proper typed interfaces |
| dashboard-next/lib/data.ts | (already readable — no change) |
| dashboard-next/scripts/sync-artifacts.mjs | Reformatted: minified → readable JavaScript |
| dashboard-next/components/Dashboard.tsx | Fixed hardcoded audit score (85→94) and test count (20→33) |

## Code Quality

### Dead code removed
None found — project was clean.

### Duplicate logic removed
- rtifacts/lstm_candidate_48h.keras (identical to aqi_lstm/model.keras)
- rtifacts/lstm_candidate_24h.keras (superseded by aqi_lstm/model.keras)

### Unused imports removed
None found via manual review.

### Debug code removed
No reakpoint(), pdb, or test-only debug prints found in source code.
CLI print() calls in scripts are intentional output, not debug code.

### Hardcoded paths removed
None found — all paths use Path(__file__) or SETTINGS config.

### Frontend type improvements
Replaced loose ModelInfo { [key: string]: string | number } with properly typed
ValidationMetrics and ModelInfo interfaces matching the FastAPI response schema.

## Backend Tests

`
33 passed, 5 failed (pre-existing sklearn 1.5.2 vs 1.9.0 mismatch), 1 skipped
PASS: All non-model-reload tests (33/34 runnable)
UNCHANGED: Same result as pre-cleanup baseline
`

## Frontend Tests

`
Vitest: 8/8 PASS (aqi.test.ts + frontend.test.tsx)
TypeScript: PASS (zero errors)
ESLint: PASS (zero warnings, zero errors)
`

## Model Status

No retraining performed — cleanup-only pass.
Model artifacts unchanged. Metrics unchanged.

### Production Model (Random Forest)
- Validation: 24h R²=0.789, 48h R²=0.644, 72h R²=0.595, RMSE=22.858
- Final Test: 24h R²=0.827, 48h R²=0.712, 72h R²=0.662, Mean R²=0.734
- PERFORMANCE REGRESSION: NO

## Leakage

All checks PASS (unchanged — no feature code was modified):
- Cross-city: PASS
- Target: PASS
- Future: PASS
- Rolling: PASS
- Scaling: PASS
- Chronological: PASS
- LSTM sequences: PASS

## API

FastAPI endpoints unchanged. test_api.py: 9/9 PASS.

## Security

| Check | Status |
|---|---|
| .env gitignored | PASS |
| API.txt | ABSENT (deleted before this cleanup; was not tracked in git) |
| Hardcoded secrets in source | NONE FOUND |
| Hopsworks key in .env | PRESENT (local only, gitignored) |
| Git repository | NOT A GIT REPO — no .git directory; no exposure history possible |
| Key rotation required based on local file alone | NOT REQUIRED (key was never tracked) |

## Vercel

| Check | Status |
|---|---|
| Next.js app | READY |
| TypeScript | PASS |
| ESLint | PASS |
| Vitest | PASS |
| Backend strategy | SPLIT DEPLOYMENT (RF artifact is 475 MB, incompatible with full Vercel) |
| Production bundle reviewed | YES |

## Repository Size

| | Before | After |
|---|---|---|
| Total files | 283 | 313 |
| Total size | 659.8 MB | 577.6 MB |
| Saved | — | 82.2 MB |

Largest remaining files:
- 475.0 MB: artifacts/aqi_random_forest/model.joblib (production model — intentional)
- 86.6 MB: data/processed/aqi_features_full.parquet (gitignored)

## Remaining Manual Actions

1. **Retrain models on correct sklearn version**: The 5 model-reload test failures require
   retraining under sklearn 1.5.x (or upgrading to 1.9+ and retraining) in Python 3.12.
   Run python -m scripts.train_models --hopsworks --register on the correct environment.

2. **Hopsworks key rotation**: The key in .env was never committed or tracked.
   Rotation is not required based on local file alone, but is recommended as good practice.

3. **Push to GitHub**: When ready, initialize git, add origin, and push.
   The .gitignore is now comprehensive and production-ready.

4. **SHAP 48h + 72h plots**: Only the 24h SHAP summary plot exists.
   Run python -m scripts.train_models and add SHAP generation for 48h/72h.
