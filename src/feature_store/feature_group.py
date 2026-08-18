import logging

import pandas as pd

from config.settings import SETTINGS
from src.data.validator import assert_hopsworks_schema

LOG = logging.getLogger(__name__)
DESCRIPTION = "Hourly weather, pollution and engineered AQI features for Pakistani cities."


def get_or_create_feature_group(feature_store):
    return feature_store.get_or_create_feature_group(
        name=SETTINGS.feature_group_name, version=SETTINGS.feature_group_version,
        description=DESCRIPTION, primary_key=["city", "timestamp"], event_time="timestamp",
        online_enabled=False, time_travel_format="HUDI",
    )


def upload_features(feature_store, frame: pd.DataFrame, wait: bool = True):
    assert_hopsworks_schema(frame)
    feature_group = get_or_create_feature_group(feature_store)
    LOG.info("Uploading %d rows to %s v%d", len(frame), SETTINGS.feature_group_name, SETTINGS.feature_group_version)
    return feature_group.insert(frame, write_options={"wait_for_job": wait})
