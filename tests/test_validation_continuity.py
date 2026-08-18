from src.data.validator import validate_observations


def test_missing_hour_reported(observations):
    frame = observations.drop(index=[3]).reset_index(drop=True)
    report = validate_observations(frame)
    assert report.missing_hours["Karachi"] == 1

