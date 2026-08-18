from config.settings import SETTINGS
from src.features.feature_engineering import TARGET_COLUMNS


def get_or_create_feature_view(feature_store, feature_group, feature_columns=None):
    selected = list(feature_columns or [])
    query_columns = ["timestamp", *selected, *TARGET_COLUMNS] if selected else None
    query = feature_group.select(query_columns) if query_columns else feature_group.select_all()
    return feature_store.get_or_create_feature_view(
        name=SETTINGS.feature_view_name, version=SETTINGS.feature_view_version,
        description="Leakage-safe multi-horizon AQI model features and labels.",
        labels=list(TARGET_COLUMNS), query=query,
    )


def create_training_dataset(feature_view, start_time, end_time, version: int = 1):
    return feature_view.create_training_data(
        start_time=start_time, end_time=end_time, data_format="parquet",
        write_options={"wait_for_job": True}, version=version,
    )
