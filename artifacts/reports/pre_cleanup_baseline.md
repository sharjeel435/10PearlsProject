# Pre-Cleanup Baseline - 17 August 2026

Captured before the final professional cleanup pass.

## Test Results (pre-cleanup)

- Python: 3.14.7, pytest: 8.4.2, sklearn: 1.9.0
- Artifacts trained on sklearn 1.5.2 (PRE-EXISTING version mismatch)
- 33 passed, 5 failed (sklearn _RemainderColsList compat), 1 skipped
- FAILED: 5 x TestRandomForestReload/TestRidgeReload (pre-existing, not caused by cleanup)

## Repository Size

- Total files: 283
- Total size: 659.8 MB

## Largest Files

- 475.0 MB  artifacts/aqi_random_forest/model.joblib
- 86.6 MB   data/processed/aqi_features_full.parquet
- 81.9 MB   artifacts/hopsworks_logs/.../stderr.log

## Production Model Metrics (from best_model.json)

Validation:   24h R2=0.789, 48h R2=0.644, 72h R2=0.595, Overall RMSE=22.858
Final Test:   24h R2=0.827, 48h R2=0.712, 72h R2=0.662, Mean R2=0.734

## Leakage: cross_city=PASS, targets=PASS, rolling=PASS, scaling=PASS, chronology=PASS

## Security: .env present (gitignored), API.txt absent, no git history to audit

## Issues Identified

1. sklearn 1.5.2 vs 1.9.0 mismatch - 5 model reload tests fail (pre-existing)
2. artifacts/lstm_candidate_24h.keras + 48h.keras - experimental duplicates at artifacts root
3. artifacts/hopsworks_logs/ - 81.9 MB job stderr log, no production value
4. artifacts/runtime/ - API/Streamlit dev run logs
5. artifacts/model_load_test.json - manual test artifact
6. dashboard-next source files minified/unformatted
7. .env.example missing placeholder descriptions
8. best_model.json has legacy flat fields (intentional backward compat)
9. .gitignore does not cover hopsworks_logs/
