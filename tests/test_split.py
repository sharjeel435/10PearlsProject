import pandas as pd

from src.training.split import chronological_split


def test_chronological_split(observations):
    split = chronological_split(observations, train_fraction=.5, validation_fraction=.4)
    assert split.train.timestamp.max() < split.validation.timestamp.min()
    assert split.validation.timestamp.max() < split.test.timestamp.min()
    assert set(split.train.city) == {"Karachi", "Lahore"}


def test_split_purges_maximum_target_horizon(observations):
    split = chronological_split(observations, train_fraction=.5, validation_fraction=.4)
    horizon = pd.Timedelta(hours=72)
    assert split.train.timestamp.max() + horizon < split.validation.timestamp.min()
    assert split.validation.timestamp.max() + horizon < split.test.timestamp.min()
