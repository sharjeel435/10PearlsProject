from config.settings import AIR_QUALITY_VARIABLES


def fetch_air_quality(client, city, start, end):
    return client.fetch_historical(city, start, end, AIR_QUALITY_VARIABLES, "air_quality")
