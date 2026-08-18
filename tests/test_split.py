from src.training.split import chronological_split


def test_chronological_split(observations):
    split = chronological_split(observations)
    assert split.train.timestamp.max() < split.validation.timestamp.min()
    assert split.validation.timestamp.max() < split.test.timestamp.min()
    assert set(split.train.city) == {"Karachi", "Lahore"}

