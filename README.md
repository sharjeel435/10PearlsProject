# Pearls AQI Predictor

Pearls AQI Predictor is a machine-learning project by **Sharjeel Safdar**.

It predicts the US Air Quality Index (AQI) for Karachi, Lahore, and Islamabad for the next **24, 48, and 72 hours**.

Live dashboard: [10-pearls-project.vercel.app](https://10-pearls-project.vercel.app)

## What this project does

The project completes the full machine-learning process:

1. Collects weather and air-quality data from Open-Meteo.
2. Checks and cleans the data.
3. Creates useful features for model training.
4. Trains and compares different models.
5. Selects the best model.
6. Generates AQI forecasts.
7. Shows the results in a web dashboard.

## How the system works

```text
Open-Meteo data
      |
      v
Data cleaning and validation
      |
      v
Feature engineering
      |
      v
Model training and testing
      |
      v
Random Forest model
      |
      v
24, 48, and 72-hour forecasts
      |
      v
FastAPI and Next.js dashboard
```

## Data

The project uses the Open-Meteo Archive and Forecast APIs.

| Item | Result |
|---|---:|
| Historical period | August 2022 to August 2026 |
| Cities | 3 |
| Raw records | 211,824 |
| Clean records | 105,912 |
| Records per city | 35,304 |
| Missing hourly timestamps | 0 |
| Duplicate timestamps | 0 |
| Missing-value rate | 0.137% |

The data includes AQI, PM2.5, PM10, CO, NO2, SO2, ozone, temperature, humidity, wind, and precipitation.

## Features

The system creates **354 features**. These help the models understand recent pollution, weather conditions, time patterns, and longer AQI trends.

Examples include:

- Current AQI and weather values
- Previous AQI values from 1 to 168 hours ago
- Average, maximum, and standard deviation values
- Hour, day, month, and seasonal patterns
- High-pollution periods
- Wind and pollution interactions

## Preventing data leakage

Data leakage happens when a model accidentally learns from future information. This can make test results look better than they really are.

This project checks that:

- Data from each city stays separate.
- Future AQI values are not used as inputs.
- Calculations only use available past data.
- Scaling is learned from training data only.
- Records remain in time order.
- LSTM sequences do not cross data boundaries.

All **6 out of 6 leakage checks passed**. A 72-hour gap is also placed between the training, validation, and test datasets.

## Dataset split

| Dataset | Rows | Period |
|---|---:|---|
| Training | 73,602 | August 2022 to May 2025 |
| Validation | 15,606 | May 2025 to December 2025 |
| Final test | 15,822 | December 2025 to August 2026 |

The validation data was used to select the best model. The final test data was only used for the final evaluation.

## Models

The project compared Ridge Regression, Random Forest, BiLSTM/LSTM, persistence, and seasonal persistence.

### Validation results

A lower RMSE score is better.

| Model | 24-hour RMSE | 48-hour RMSE | 72-hour RMSE | Overall RMSE |
|---|---:|---:|---:|---:|
| Random Forest | 18.50 | 24.16 | 25.90 | **22.85** |
| Ridge Regression | 17.96 | 24.61 | 26.20 | 22.92 |
| BiLSTM/LSTM | 20.12 | 24.94 | 26.78 | 23.95 |
| Persistence | 22.33 | 28.78 | 31.63 | 27.58 |
| Seasonal persistence | 28.83 | 31.64 | 34.18 | 31.55 |

**Random Forest** had the best overall validation score, so it was selected as the production model.

## Final test results

| Forecast | RMSE | MAE | R² |
|---|---:|---:|---:|
| 24 hours | 19.07 | 13.33 | 0.824 |
| 48 hours | 24.70 | 17.59 | 0.704 |
| 72 hours | 26.34 | 19.01 | 0.662 |
| Overall | 23.37 | 16.64 | 0.730 |

The model performs best for the 24-hour forecast. Its overall R² score of 0.730 means it explains about 73% of the AQI changes in the final test data.

### Results by city for the 24-hour forecast

| City | Random Forest RMSE | Persistence RMSE | Improvement |
|---|---:|---:|---:|
| Islamabad | 15.52 | 16.72 | 7% |
| Karachi | 12.85 | 15.39 | 17% |
| Lahore | 26.18 | 32.17 | 19% |

Karachi has the lowest prediction error. Lahore is harder to predict, but the model still improves most over the simple persistence method in Lahore.

## Model explanation

The project uses SHAP to show which features affect Random Forest predictions. The most important features include current AQI, recent maximum and average AQI, AQI above 150, and continuous high-AQI hours.

This shows that recent AQI conditions are very important, especially for the 24-hour forecast.

## Dashboard and API

The dashboard shows current observations, forecasts, AQI categories, city comparisons, historical charts, model results, SHAP explanations, and pipeline status.

The FastAPI backend provides:

| Endpoint | Purpose |
|---|---|
| `/health` | Check service health |
| `/cities` | List supported cities |
| `/forecast/{city}` | Get forecasts for one city |
| `/model-info` | View production-model information |

## Automation

| Workflow | Schedule | Purpose |
|---|---|---|
| Feature pipeline | Every hour | Refresh and validate recent data |
| Model training | Daily at 03:00 UTC | Train and register models |
| Forecast pipeline | Daily at 05:00 UTC | Generate forecasts and dashboard files |

Forecast files are committed to GitHub. Vercel detects the updates and redeploys the dashboard.

## Technology used

| Part | Technology |
|---|---|
| Data | Open-Meteo |
| Programming language | Python 3.12 |
| Machine learning | Scikit-learn |
| Deep learning | TensorFlow/Keras |
| Feature store and model registry | Hopsworks |
| Model explanation | SHAP |
| API | FastAPI |
| Frontend | Next.js 16 |
| Backend hosting | Render |
| Frontend hosting | Vercel |
| Automation | GitHub Actions |
| Testing | pytest and Vitest |

## Project folders

```text
.github/workflows/   Automatic pipelines
api/                 FastAPI deployment entry point
artifacts/           Forecasts, results, and SHAP files
config/              Project settings
dashboard-next/      Next.js dashboard
scripts/             Data, training, and prediction scripts
src/                 Main Python source code
tests/               Python tests
```

## Run the project locally

### Set up Python

```powershell
git clone https://github.com/sharjeel435/10PearlsProject.git
cd 10PearlsProject
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
pip install -e ".[dev,hopsworks,lstm,explain,app]"
Copy-Item .env.example .env
```

Add your Hopsworks API key to `.env` when you need Hopsworks features.

### Run the API

```powershell
uvicorn src.api.app:app --host 127.0.0.1 --port 8000
```

### Run the dashboard

```powershell
cd dashboard-next
npm ci
npm run dev
```

Open `http://localhost:3000` in your browser.

## Run tests

```powershell
python -m pytest -q
npm --prefix dashboard-next test
npm --prefix dashboard-next run typecheck
npm --prefix dashboard-next run build
```

Latest verified results:

- 58 Python tests passed
- 24 frontend tests passed
- 0 failures
- TypeScript and production build passed

## Project status

| Part | Status |
|---|---|
| Data pipeline | Complete |
| Model training and evaluation | Complete |
| Random Forest explanation | Complete |
| FastAPI backend | Complete |
| Next.js dashboard | Complete |
| GitHub Actions automation | Implemented |
| Deployment setup | Implemented |
| Production model | Random Forest |

## Limitations and future work

- Forecasts do not include uncertainty ranges.
- Only three cities are supported.
- Forecast quality becomes lower for longer periods.
- The dashboard can show old data if an automatic workflow fails.
- Future improvements can include alerts, more cities, drift monitoring, and stronger LSTM explanations.

## Important note

These forecasts are machine-learning estimates based on third-party data. They should not replace official air-quality stations, health advice, or emergency alerts.
