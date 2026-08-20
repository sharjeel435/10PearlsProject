import logging
import time

import pandas as pd

from config.settings import SETTINGS
from src.data.validator import assert_hopsworks_schema

LOG = logging.getLogger(__name__)
DESCRIPTION = "Hourly weather, pollution and engineered AQI features for Pakistani cities."

# Non-destructive v1 schema extension introduced with the August 2026 feature
# update. Existing historical rows legitimately receive nulls for these new
# columns; no Feature Group or historical data is replaced.
V1_SCHEMA_EXTENSIONS = {
    *(f"aqi_ema_{hours}h" for hours in (3, 6, 12, 24, 48, 72)),
    *(f"pm25_ema_{hours}h" for hours in (3, 6, 12, 24, 48, 72)),
    "boundary_stability_index",
    "dew_point_depression",
    "ventilation_proxy",
}


def get_or_create_feature_group(feature_store):
    return feature_store.get_or_create_feature_group(
        name=SETTINGS.feature_group_name, version=SETTINGS.feature_group_version,
        description=DESCRIPTION, primary_key=["city", "timestamp"], event_time="timestamp",
    )


def append_v1_schema_extensions(feature_group, frame: pd.DataFrame) -> None:
    """Append only the reviewed, backward-compatible v1 feature additions."""
    existing = {feature.name.lower() for feature in feature_group.columns}
    if not existing:
        # A new Feature Group has no persisted schema yet; insert() will infer
        # the complete schema from the first dataframe.
        return
    missing = {column.lower() for column in frame.columns} - existing
    if not missing:
        return
    unexpected = missing - V1_SCHEMA_EXTENSIONS
    if unexpected:
        raise ValueError(
            "Feature Group schema is missing unapproved columns: "
            f"{sorted(unexpected)}"
        )
    from hsfs.feature import Feature

    LOG.info("Appending %d reviewed features to the existing Feature Group schema", len(missing))
    feature_group.append_features(
        [Feature(name=name, type="double") for name in sorted(missing)]
    )


def verify_feature_rows(
    feature_group,
    frame: pd.DataFrame,
    timeout_seconds: int = 600,
    poll_seconds: int = 15,
) -> pd.DataFrame:
    """Wait until every submitted city/timestamp key is readable offline."""
    start = frame["timestamp"].min()
    end = frame["timestamp"].max() + pd.Timedelta(hours=1)
    expected = {
        (str(row.city), pd.Timestamp(row.timestamp))
        for row in frame[["city", "timestamp"]].itertuples(index=False)
    }
    deadline = time.monotonic() + timeout_seconds
    last_error: Exception | None = None
    while time.monotonic() < deadline:
        try:
            stored = feature_group.read(start_time=start, end_time=end)
            observed = {
                (str(row.city), pd.Timestamp(row.timestamp))
                for row in stored[["city", "timestamp"]].itertuples(index=False)
            }
            if expected <= observed:
                LOG.info("Verified %d feature rows by event-time readback", len(expected))
                return stored
        except Exception as exc:  # transient while asynchronous materialization starts
            last_error = exc
            LOG.warning("Feature readback is not ready yet: %s", type(exc).__name__)
        time.sleep(poll_seconds)
    message = f"Feature Store readback timed out after {timeout_seconds} seconds"
    if last_error:
        raise TimeoutError(message) from last_error
    raise TimeoutError(message)


def upload_features(
    feature_store,
    frame: pd.DataFrame,
    wait: bool = True,
    verify_readback: bool = False,
):
    assert_hopsworks_schema(frame)
    feature_group = get_or_create_feature_group(feature_store)
    append_v1_schema_extensions(feature_group, frame)
    LOG.info("Uploading %d rows to %s v%d", len(frame), SETTINGS.feature_group_name, SETTINGS.feature_group_version)
    result = feature_group.insert(frame, write_options={"wait_for_job": wait})
    if verify_readback:
        verify_feature_rows(feature_group, frame)
    return result
