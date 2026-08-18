from config.settings import WEATHER_VARIABLES


def fetch_weather(client, city, start, end):
    return client.fetch_historical(city, start, end, WEATHER_VARIABLES, "weather")
