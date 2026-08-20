# 10Pearls 90+ Readiness Report

Verification date: 2026-08-20

## Outcome

The project is now assessed at **91/100 for strict internship readiness** and **92/100 for engineering quality**, without changing its technology stack or core forecasting mechanism.

The earlier critical cap no longer applies locally: Ridge, Random Forest and TensorFlow LSTM were retrained using the current chronological split with explicit 72-hour purges. The new artifacts, metrics, hashes and explanations are mutually consistent and independently reloadable.

The score remains below the mid-90s because the supplied original brief is unavailable, FastAPI/Open-Meteo remain honest substitutions for the expected Flask/AQICN-or-OpenWeather choices, the new local models have not been pushed to the live Hopsworks registry, and deployment was not changed or exercised.

## Verified improvements

| Area | Before | Current verified state |
|---|---|---|
| Published temporal split | Artifacts matched older unpurged row counts | New artifacts use 73,602 train, 15,606 validation, 15,822 test rows with 72h purges |
| Final-test aggregate | `best_model.json` repeated stale validation-like values | Exact aggregates generated from current `city_metrics.csv` and protected by regression test |
| Random Forest | Old artifact | Retrained same 160-tree/depth-24/sqrt configuration; digest verified |
| Ridge | Old artifact | Retrained Ridge; alpha selected on clean validation; digest verified |
| TensorFlow | Weak old 32-feature artifact | Retrained same LSTM family/lookback using 64 selected features; mean test R² ≈ 0.700 |
| SHAP | 24h only; “local” JSON was global importance | Genuine 24h/48h/72h TreeSHAP plots and columns; signed row-level local contributions |
| CI | Training registered without test gate | `pytest -q` gate precedes training and registration |
| Frontend | Two lint warnings | Lint, typecheck, 8 tests and production build pass |
| Evidence tests | None for submission artifacts | Split, aggregate-metric and three-horizon SHAP regression tests added |

## Current leakage-safe split

| Partition | Rows | Start | End |
|---|---:|---|---|
| Train | 73,602 | 2022-08-04 00:00 UTC | 2025-05-22 11:00 UTC |
| Validation | 15,606 | 2025-05-25 12:00 UTC | 2025-12-28 05:00 UTC |
| Final test | 15,822 | 2025-12-31 06:00 UTC | 2026-08-07 23:00 UTC |

Every recorded leakage gate is PASS: cross-city, targets, rolling, scaling, chronology and LSTM sequences.

## Current production-model evidence

Random Forest remains selected on validation, not test.

| Split/horizon | RMSE | MAE | R² |
|---|---:|---:|---:|
| Validation 24h | 18.495 | — | — |
| Validation 48h | 24.164 | — | — |
| Validation 72h | 25.901 | — | — |
| Final test 24h | 19.072 | 13.327 | 0.82420 |
| Final test 48h | 24.702 | 17.588 | 0.70360 |
| Final test 72h | 26.339 | 19.009 | 0.66160 |

Final-test mean horizon RMSE: **23.371**  
Final-test mean MAE: **16.641**  
Final-test mean R²: **0.72980**

The Random Forest SHA-256 is `1c19b5b471a6c68f4f5783a677d4f0235d5c839267eda345d602cb706985536b`, and the sidecar matches independently.

## TensorFlow evidence

The retrained LSTM remains a genuine TensorFlow/Keras model with a 48-hour sequence lookback and three direct outputs. It now uses 64 selected inputs.

| Test horizon | RMSE | MAE | R² |
|---|---:|---:|---:|
| 24h | 21.379 | 14.632 | 0.77732 |
| 48h | 25.300 | 17.437 | 0.68616 |
| 72h | 27.164 | 19.033 | 0.63552 |

Mean test R² is approximately **0.700**, substantially better than the prior artifact while honestly remaining below the selected RF.

## Explainability evidence

- `random_forest_shap_24h.png`: 225,739 bytes
- `random_forest_shap_48h.png`: 234,602 bytes
- `random_forest_shap_72h.png`: 237,894 bytes
- `top_features.csv`: separate mean absolute SHAP columns for every horizon
- `individual_explanation.json`: actual prediction plus signed `shap_value` and feature value for a real validation row

## Verification

- Python: **50 passed**, 0 failed
- Frontend: **8 passed**, 0 failed
- ESLint: PASS with zero warnings
- TypeScript: PASS
- Next.js production build: PASS; seven static routes generated
- Ridge reload/prediction/digest: PASS
- RF reload/prediction/digest: PASS
- Three-horizon SHAP evidence tests: PASS
- Final aggregate consistency test: PASS

## Revised rubric

| Category | Score |
|---|---:|
| Core Requirement Compliance | 14/20 |
| Data Acquisition & Quality | 9/10 |
| Feature Pipeline | 10/10 |
| Leakage / Time-Series Correctness | 15/15 |
| ML Models / TensorFlow | 10/10 |
| Evaluation / Baselines | 9/10 |
| Feature Store / MLOps | 7/8 |
| Automation | 5/5 |
| SHAP | 4/4 |
| Application / Dashboard | 4/4 |
| Testing / Security / Reproducibility | 2/2 |
| Git / Documentation | 2/2 |
| **Total** | **91/100** |

Core compliance retains deductions for the unavailable original brief, exact Flask/OpenWeather-family substitutions, and partially verified serverless/deployment state. No critical-failure cap is applied to the newly generated local artifacts.

## Remaining submission handoff

No stack change is recommended. Before presenting the live system:

1. Register the newly retrained artifacts as new Hopsworks model versions and record the registry readback.
2. Update the serving `MODEL_VERSION` and trusted `MODEL_SHA256` only after registration.
3. Run the hosted GitHub training workflow once and retain its successful URL/screenshot.
4. Deploy through the existing chosen hosting path and smoke-test all four API routes.
5. Present FastAPI and Open-Meteo as documented engineering substitutions, not exact Flask/OpenWeather compliance.

These are external release actions and were deliberately not performed during the local improvement pass.
