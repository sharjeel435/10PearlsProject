from dataclasses import dataclass


@dataclass(frozen=True)
class City:
    name: str
    latitude: float
    longitude: float
    timezone: str = "Asia/Karachi"


CITIES = (
    City("Karachi", 24.8607, 67.0011),
    City("Lahore", 31.5204, 74.3587),
    City("Islamabad", 33.6844, 73.0479),
)

