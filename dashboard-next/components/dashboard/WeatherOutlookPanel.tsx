"use client";

import { CloudRain, ExternalLink, Gauge, Thermometer, Wind } from "lucide-react";
import { weatherLabel, type CityWeatherOutlook } from "@/lib/openmeteo";

export default function WeatherOutlookPanel({ city, outlooks }: { city: string; outlooks: CityWeatherOutlook[] }) {
  const outlook = outlooks.find((item) => item.city === city);
  return (
    <div className="weather-outlook-panel">
      <div className="weather-outlook-header">
        <div>
          <p className="panel-title" style={{ marginBottom: "6px" }}>Live Weather Drivers · Next 72 Hours</p>
          <p className="weather-outlook-copy">
            Independent atmospheric context from Open-Meteo. These values explain dispersion conditions; they do not replace the ML AQI forecast.
          </p>
        </div>
        <a className="weather-source-link" href="https://open-meteo.com/" target="_blank" rel="noreferrer">
          Open-Meteo <ExternalLink size={12} aria-hidden="true" />
        </a>
      </div>

      {!outlook ? (
        <div className="weather-outlook-empty" role="status">
          Live weather context is temporarily unavailable. AQI forecasts remain available.
        </div>
      ) : (
        <div className="weather-day-grid">
          {outlook.days.map((day, index) => (
            <article className="weather-day-card" key={day.date}>
              <div className="weather-day-heading">
                <div>
                  <span className="weather-day-kicker">{index === 0 ? "Today" : `Day ${index + 1}`}</span>
                  <h3>{new Date(`${day.date}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</h3>
                </div>
                <span className="badge neutral">{weatherLabel(day.weatherCode)}</span>
              </div>
              <div className="weather-driver-grid">
                <div><Thermometer size={15} /><span>Temperature</span><strong>{Math.round(day.temperatureMin)}–{Math.round(day.temperatureMax)}°C</strong></div>
                <div><CloudRain size={15} /><span>Precipitation</span><strong>{day.precipitation.toFixed(1)} mm</strong></div>
                <div><Wind size={15} /><span>Peak wind</span><strong>{Math.round(day.windSpeedMax)} km/h</strong></div>
                <div><Gauge size={15} /><span>Dispersion signal</span><strong>{day.windSpeedMax >= 20 ? "Stronger" : day.windSpeedMax >= 10 ? "Moderate" : "Limited"}</strong></div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
