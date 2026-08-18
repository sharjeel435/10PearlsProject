import numpy as np

from src.features.feature_engineering import TARGET_COLUMNS, assert_no_leakage, create_targets, engineer_features, usable_feature_columns
from src.features.interaction_features import safe_ratio
from src.features.lag_features import add_lag_features
from src.features.rolling_features import add_rolling_features


def test_lags_and_city_isolation(observations):
    result = add_lag_features(observations.copy())
    karachi = result[result.city == "Karachi"]
    lahore = result[result.city == "Lahore"]
    assert karachi.iloc[1].aqi_lag_1h == karachi.iloc[0].us_aqi
    assert np.isnan(lahore.iloc[0].aqi_lag_1h)
    assert lahore.iloc[1].aqi_lag_1h == lahore.iloc[0].us_aqi


def test_rolling_is_historical_and_city_isolated(observations):
    result = add_rolling_features(observations.copy())
    first_lahore = result[result.city == "Lahore"].iloc[0]
    assert first_lahore.aqi_rolling_mean_3h == first_lahore.us_aqi
    third = result[result.city == "Karachi"].iloc[2]
    assert third.aqi_rolling_mean_3h == np.mean([0, 1, 2])


def test_targets_do_not_cross_city(observations):
    result = create_targets(observations.copy())
    last_karachi = result[result.city == "Karachi"].iloc[-1]
    assert all(np.isnan(last_karachi[c]) for c in TARGET_COLUMNS)
    assert result.iloc[0].target_aqi_24h == observations.iloc[24].us_aqi


def test_feature_count_and_leakage(observations):
    result = engineer_features(observations)
    columns = usable_feature_columns(result)
    assert len(columns) >= 100
    assert not set(TARGET_COLUMNS) & set(columns)
    assert_no_leakage(columns)


def test_ratio_zero_is_missing():
    import pandas as pd
    result = safe_ratio(pd.Series([1., 2.]), pd.Series([0., 2.]))
    assert np.isnan(result.iloc[0]) and result.iloc[1] == 1

