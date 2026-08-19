"use client";

import WindCompass from "@/components/weather/WindCompass";
import { getCardinalDirection } from "@/lib/aqi";
import type { LatestObservation } from "@/lib/types";

interface WeatherPanelProps {
  observation: LatestObservation | null | undefined;
}

function fmt(val: number | null | undefined, digits = 1, fallback = "—"): string {
  if (val == null || !Number.isFinite(val)) return fallback;
  return val.toFixed(digits);
}

export default function WeatherPanel({ observation }: WeatherPanelProps) {
  const windDir = observation?.wind_direction_10m ?? null;
  const windSpd = observation?.wind_speed_10m ?? null;
  const cardinal = getCardinalDirection(windDir);

  return (
    <div>
      <p className="panel-title">Weather Context</p>

      {/* Wind — with compass (functional, not decorative) */}
      <div className="compass-wrapper">
        <WindCompass directionDegrees={windDir} speedKmh={windSpd} />
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span className="data-label">Wind</span>
          <span className="data-value tabular">
            {windSpd != null ? `${fmt(windSpd)} km/h` : "—"}
            {windDir != null && cardinal && (
              <span style={{ color: "var(--text-muted)", fontWeight: 500, marginLeft: "6px" }}>
                {cardinal} · {Math.round(windDir)}°
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Data rows */}
      <div className="data-list">
        {[
          {
            label: "Temperature",
            value: observation?.temperature_2m != null ? `${fmt(observation.temperature_2m)}°C` : "—",
          },
          {
            label: "Humidity",
            value: observation?.relative_humidity_2m != null ? `${Math.round(observation.relative_humidity_2m)}%` : "—",
          },
          {
            label: "Pressure",
            value: observation?.surface_pressure != null ? `${Math.round(observation.surface_pressure)} hPa` : "—",
          },
          {
            label: "Precipitation",
            value: observation?.precipitation != null ? `${fmt(observation.precipitation)} mm` : "0.0 mm",
          },
        ].map((row) => (
          <div key={row.label} className="data-row">
            <span className="data-label">{row.label}</span>
            <span className="data-value tabular">{row.value}</span>
          </div>
        ))}
      </div>

      <p style={{ fontSize: "11px", color: "var(--text-faint)", marginTop: "16px", lineHeight: 1.55 }}>
        Weather affects pollutant accumulation and dispersion dynamics but does not directly represent air quality on its own.
      </p>
    </div>
  );
}
