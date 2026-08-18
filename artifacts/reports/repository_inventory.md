# Repository Inventory - 17 August 2026

Classification of every significant file and directory after the final cleanup pass.

## Root Level

| File/Dir | Status | Purpose |
|---|---|---|
| .env | KEEP (gitignored) | Local secrets — never committed |
| .env.example | KEEP | Placeholder template with descriptions |
| .gitignore | KEEP | Updated to cover hopsworks_logs, runtime, egg-info, tsconfig.tsbuildinfo |
| .github/workflows/ | KEEP | feature_pipeline.yml + training_pipeline.yml |
| README.md | KEEP | Main project documentation |
| pi/index.py | KEEP | Thin deployment entrypoint for full-Vercel experiments |
| rtifacts/ | KEEP (gitignored) | Production artifacts, reports, metrics |
| config/ | KEEP | Single source of truth: cities.py, settings.py |
| dashboard/app.py | KEEP (legacy) | Streamlit secondary/demo interface |
| dashboard-next/ | KEEP | Primary Next.js web application |
| data/ | KEEP (gitignored) | Raw and processed data directories |
| main.py | KEEP | CLI convenience entry for feature pipeline |
| pyproject.toml | KEEP | Authoritative dependency specification |
| 
equirements.txt | KEEP (with comment) | Developer install shortcut |
| 
untime.txt | KEEP | Python runtime declaration for deployment |
| scripts/ | KEEP | Pipeline scripts: backfill, features, train, predict, export |
| src/ | KEEP | All production source code |
| 	ests/ | KEEP | 39 test suite |

## Artifacts Directory

| Path | Status | Purpose |
|---|---|---|
| rtifacts/best_model.json | KEEP | Authoritative model metrics with validation/test split |
| rtifacts/city_metrics.csv | KEEP | Per-city per-horizon test metrics |
| rtifacts/model_comparison.csv | KEEP | Validation comparison table |
| rtifacts/training_summary.json | KEEP | Feature counts and split details |
| rtifacts/leakage_report.json | KEEP | Leakage audit results |
| rtifacts/data_quality_report.json | KEEP | Data cleaning report |
| rtifacts/feature_manifest.csv | KEEP | Feature selection audit |
| rtifacts/feature_quality_report.csv | KEEP | Feature filtering results |
| rtifacts/latest_forecasts.json | KEEP | Current production forecast output |
| rtifacts/latest_observations.json | KEEP | Latest source observations |
| rtifacts/historical_daily_30d.json | KEEP | 30-day daily aggregates for frontend |
| rtifacts/audit_report.md | KEEP | A-to-Z acceptance audit |
| rtifacts/aqi_random_forest/ | KEEP | Production model (model.joblib + sha256 + metrics) |
| rtifacts/aqi_ridge/ | KEEP | Ridge benchmark (model.joblib + sha256 + metrics) |
| rtifacts/aqi_lstm/ | KEEP | LSTM benchmark (model.keras + preprocessing + metrics) |
| rtifacts/eda/ | KEEP | EDA plots and CSV summaries |
| rtifacts/shap/ | KEEP | SHAP summary plot, top features, individual explanation |
| rtifacts/reports/ | KEEP | Vercel readiness + pre-cleanup baseline |
| rtifacts/lstm_candidate_24h.keras | DELETED | Experimental 24h LSTM checkpoint, not final model |
| rtifacts/lstm_candidate_48h.keras | DELETED | Identical to aqi_lstm/model.keras |
| rtifacts/hopsworks_logs/ | DELETED | 81.9 MB materialization job stderr log |
| rtifacts/runtime/ | DELETED | API + Streamlit dev run logs |
| rtifacts/model_load_test.json | DELETED | Manual test artifact |

## Source Code (src/)

All modules are KEEP. Structure is clear and well-separated:

| Module | Responsibility |
|---|---|
| src/api/app.py | FastAPI application (health, cities, forecast, model-info) |
| src/data/openmeteo_client.py | Open-Meteo API client with chunked fetching and caching |
| src/data/cleaner.py | Merge, validate bounds, interpolate gaps |
| src/data/validator.py | Schema validation, gap detection, quality reporting |
| src/features/feature_engineering.py | Orchestrates all feature families, leakage assertion |
| src/features/lag_features.py | City-isolated lag features |
| src/features/rolling_features.py | Historical trailing rolling statistics |
| src/features/time_features.py | Cyclical time encodings |
| src/features/interaction_features.py | Interaction ratios and episode flags |
| src/features/quality.py | Feature selection by missingness, variance, correlation |
| src/training/split.py | Chronological train/validation/test split |
| src/training/ridge_trainer.py | Ridge with alpha grid search |
| src/training/random_forest_trainer.py | RF with candidate hyperparameter sweep |
| src/training/lstm_trainer.py | LSTM sequence builder and trainer |
| src/training/evaluation.py | Regression metrics, per-horizon evaluation |
| src/training/leakage_audit.py | Post-training leakage verification |
| src/training/baselines.py | Persistence and seasonal-persistence baselines |
| src/training/model_registry.py | Hopsworks model registry upload |
| src/prediction/predictor.py | SHA-256 verified model loader, forecast generator |
| src/prediction/categories.py | US EPA AQI category thresholds |
| src/feature_store/hopsworks_connection.py | Hopsworks project login |
| src/feature_store/feature_group.py | Feature Group upload |
| src/feature_store/feature_view.py | Feature View creation |
| src/explainability/shap_analysis.py | SHAP tree explainer for all 3 horizons |
| src/eda/report.py | EDA plots and statistics |

## Known Issue — Not Caused by Cleanup

The 5 model-reload test failures are caused by a sklearn version mismatch:
- Artifacts were serialized under sklearn 1.5.2
- Current environment has sklearn 1.9.0
- _RemainderColsList was removed between versions
- **Resolution**: Retrain models on Python 3.12 / sklearn 1.5.x, or upgrade to latest sklearn and retrain
- This is documented in the README and the pre_cleanup_baseline.md
