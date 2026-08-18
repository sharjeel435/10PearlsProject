import numpy as np

from src.data.cleaner import clean_observations
from src.data.validator import assert_hopsworks_schema, validate_observations


def test_ordering_missing_handling_and_schema(observations):
    frame = observations.sample(frac=1, random_state=42).copy()
    frame.loc[frame.index[2], "relative_humidity_2m"] = 150
    frame.loc[frame.index[3], "pm2_5"] = -1
    clean, report = clean_observations(frame)
    assert clean.equals(clean.sort_values(["city", "timestamp"]).reset_index(drop=True))
    assert report["invalid_values_set_missing"] == 2
    assert_hopsworks_schema(clean)
    assert validate_observations(clean).duplicate_keys == 0


def test_duplicate_schema_rejected(observations):
    import pandas as pd
    import pytest
    duplicated = pd.concat([observations, observations.iloc[[0]]], ignore_index=True)
    with pytest.raises(ValueError, match="primary key"):
        assert_hopsworks_schema(duplicated)

