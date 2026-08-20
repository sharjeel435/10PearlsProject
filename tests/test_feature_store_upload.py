from types import SimpleNamespace

import pandas as pd
import pytest

from src.feature_store.feature_group import (
    V1_SCHEMA_EXTENSIONS,
    append_v1_schema_extensions,
    verify_feature_rows,
)


class FakeFeatureGroup:
    def __init__(self, columns, stored=None):
        self.columns = [SimpleNamespace(name=name) for name in columns]
        self.stored = stored
        self.appended = []

    def append_features(self, features):
        self.appended.extend(features)

    def read(self, **_):
        return self.stored


def test_reviewed_schema_extensions_are_appended_as_doubles():
    group = FakeFeatureGroup(["city", "timestamp"])
    frame = pd.DataFrame(columns=["city", "timestamp", *sorted(V1_SCHEMA_EXTENSIONS)])

    append_v1_schema_extensions(group, frame)

    assert {feature.name for feature in group.appended} == V1_SCHEMA_EXTENSIONS
    assert {feature.type for feature in group.appended} == {"double"}


def test_unreviewed_schema_drift_is_rejected():
    group = FakeFeatureGroup(["city", "timestamp"])
    frame = pd.DataFrame(columns=["city", "timestamp", "unreviewed_feature"])

    with pytest.raises(ValueError, match="unreviewed_feature"):
        append_v1_schema_extensions(group, frame)


def test_readback_requires_every_submitted_key():
    submitted = pd.DataFrame(
        {
            "city": ["Karachi", "Lahore"],
            "timestamp": pd.to_datetime(["2026-08-19T23:00Z"] * 2, utc=True),
        }
    )
    group = FakeFeatureGroup(submitted.columns, stored=submitted.iloc[:1])

    with pytest.raises(TimeoutError, match="timed out"):
        verify_feature_rows(group, submitted, timeout_seconds=0, poll_seconds=0)


def test_readback_accepts_complete_idempotent_upsert():
    submitted = pd.DataFrame(
        {
            "city": ["Karachi", "Lahore"],
            "timestamp": pd.to_datetime(["2026-08-19T23:00Z"] * 2, utc=True),
        }
    )
    group = FakeFeatureGroup(submitted.columns, stored=submitted.copy())

    stored = verify_feature_rows(group, submitted, timeout_seconds=1, poll_seconds=0)

    assert len(stored) == 2
