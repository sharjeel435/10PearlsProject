"use client";

import { getAQICategory, getCategoryHex, getCategoryShortLabel } from "@/lib/aqi";

interface CityForecastData {
  city: string;
  currentAQI: number | null;
  forecast24h: number | null;
  forecast48h: number | null;
  forecast72h: number | null;
}

interface CityComparisonPanelProps {
  forecasts: any[];
  observations: any[];
  activeCity: string;
  onSelectCity: (city: string) => void;
}

function AQICell({ value }: { value: number | null }) {
  if (value == null || !Number.isFinite(value)) {
    return <span style={{ color: "var(--text-faint)" }}>—</span>;
  }
  const rounded = Math.round(value);
  const cat = getAQICategory(rounded);
  const hex = getCategoryHex(cat);
  const short = getCategoryShortLabel(cat);
  return (
    <span style={{ display: "flex", flexDirection: "column", gap: "1px", alignItems: "flex-end" }}>
      <span className="tabular" style={{ fontWeight: 700, color: hex, fontSize: "15px", letterSpacing: "-0.02em" }}>
        {rounded}
      </span>
      <span style={{ fontSize: "9px", fontWeight: 600, color: hex, opacity: 0.7, letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {short}
      </span>
    </span>
  );
}

export default function CityComparisonPanel({
  forecasts,
  observations,
  activeCity,
  onSelectCity,
}: CityComparisonPanelProps) {
  const cities: CityForecastData[] = ["Karachi", "Lahore", "Islamabad"].map((cityName) => {
    const fc = forecasts?.find((f: any) => f.city === cityName);
    const obs = observations?.find((o: any) => o.city === cityName);
    return {
      city: cityName,
      currentAQI: obs?.us_aqi ?? null,
      forecast24h: fc?.predicted_aqi_24h ?? fc?.forecasts?.["24h"]?.aqi ?? null,
      forecast48h: fc?.predicted_aqi_48h ?? fc?.forecasts?.["48h"]?.aqi ?? null,
      forecast72h: fc?.predicted_aqi_72h ?? fc?.forecasts?.["72h"]?.aqi ?? null,
    };
  });

  // Sort by current AQI descending (worst first) — stable sort
  const sorted = [...cities].sort((a, b) => {
    const av = a.currentAQI ?? a.forecast24h ?? 0;
    const bv = b.currentAQI ?? b.forecast24h ?? 0;
    return bv - av;
  });

  return (
    <div>
      <p className="panel-title">City Comparison · Multi-Horizon Forecast</p>

      <div className="city-comparison-table" role="table" aria-label="City AQI comparison">
        {/* Header */}
        <div className="city-comparison-header" role="row">
          <span role="columnheader">City</span>
          <span role="columnheader">Now</span>
          <span role="columnheader">+24H</span>
          <span role="columnheader">+48H</span>
          <span role="columnheader">+72H</span>
        </div>

        {/* Rows */}
        {sorted.map((row) => {
          const isActive = row.city === activeCity;
          const rowAQI = row.currentAQI ?? row.forecast24h;
          const rowCat = rowAQI != null ? getAQICategory(Math.round(rowAQI)) : null;
          const rowHex = rowCat ? getCategoryHex(rowCat) : "transparent";

          return (
            <button
              key={row.city}
              className={`city-comparison-row${isActive ? " active" : ""}`}
              onClick={() => onSelectCity(row.city)}
              aria-label={`${row.city} — current AQI ${row.currentAQI != null ? Math.round(row.currentAQI) : "unavailable"}. Select to view forecast.`}
              aria-current={isActive ? "true" : undefined}
            >

              <span
                className="city-comparison-city"
                role="rowheader"
                style={{ borderLeftColor: isActive ? rowHex : "transparent" }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: rowHex,
                    flexShrink: 0,
                    display: "inline-block",
                  }}
                  aria-hidden="true"
                />
                {row.city}
              </span>
              <span role="cell"><AQICell value={row.currentAQI} /></span>
              <span role="cell"><AQICell value={row.forecast24h} /></span>
              <span role="cell"><AQICell value={row.forecast48h} /></span>
              <span role="cell"><AQICell value={row.forecast72h} /></span>
            </button>
          );
        })}
      </div>

      <p style={{ fontSize: "10px", color: "var(--text-faint)", marginTop: "10px" }}>
        Cities sorted by current AQI (worst first). Click a city to update the dashboard.
      </p>
    </div>
  );
}
