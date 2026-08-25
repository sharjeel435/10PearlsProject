"use client";

import { getAQICategory, getCategoryGuidance, calculateTrend, getCategoryHex } from "@/lib/aqi";
import Tooltip from "@/components/ui/Tooltip";
import type { LatestObservation } from "@/lib/types";

interface HealthIntelligenceCardProps {
  currentAQI: number | null;
  forecast72hAQI: number | null;
  observation?: LatestObservation | null;
}

/** Derive the highest-concentration pollutant from available observation data */
function derivePrimaryPollutant(obs: LatestObservation | null | undefined): string {
  if (!obs) return "PM2.5"; // default to most common urban pollutant

  // Use normalized percentages of typical thresholds to find the dominant pollutant
  const candidates: Array<{ name: string; value: number | null; threshold: number }> = [
    { name: "PM2.5", value: obs.pm2_5, threshold: 35 },
    { name: "PM10",  value: obs.pm10,  threshold: 75 },
    { name: "O₃",    value: obs.ozone, threshold: 100 },
    { name: "NO₂",   value: obs.nitrogen_dioxide, threshold: 40 },
    { name: "SO₂",   value: obs.sulphur_dioxide,  threshold: 20 },
    { name: "CO",    value: obs.carbon_monoxide,  threshold: 400 },
  ];

  let maxRatio = 0;
  let primary = "PM2.5";
  for (const c of candidates) {
    if (c.value == null || !Number.isFinite(c.value)) continue;
    const ratio = c.value / c.threshold;
    if (ratio > maxRatio) {
      maxRatio = ratio;
      primary = c.name;
    }
  }
  return primary;
}

export default function HealthIntelligenceCard({
  currentAQI,
  forecast72hAQI,
  observation,
}: HealthIntelligenceCardProps) {
  const numericAqi = currentAQI != null && Number.isFinite(currentAQI) ? currentAQI : 75;
  const category = getAQICategory(numericAqi);
  const guidance = getCategoryGuidance(category);
  const colorHex = getCategoryHex(category);
  const primaryPollutant = derivePrimaryPollutant(observation);

  const endAqi = forecast72hAQI != null && Number.isFinite(forecast72hAQI) ? forecast72hAQI : numericAqi;
  const trend = calculateTrend(numericAqi, endAqi);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Health guidance */}
      <div>
        <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-faint)", textTransform: "uppercase", marginBottom: "10px" }}>
          Health Guidance
        </p>
        <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.55, marginBottom: "8px" }}>
          {guidance.summary}
        </p>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.6 }}>
          {guidance.advice}
        </p>
      </div>

      {/* Details */}
      <div className="data-list" style={{ paddingTop: "4px" }}>
        <div className="data-row">
          <span className="data-label">Primary Pollutant</span>
          <span className="data-value">
            <Tooltip term={primaryPollutant} customText={observation ? `Highest relative concentration from current observation` : `Default — observation data unavailable`}>
              <span style={{ cursor: "help", borderBottom: "1px dashed var(--border-medium)" }}>
                {primaryPollutant}
              </span>
            </Tooltip>
          </span>
        </div>

        <div className="data-row">
          <span className="data-label">72h Trajectory</span>
          <span
            className="data-value"
            style={{
              color:
                trend.direction === "worsening"
                  ? "var(--aqi-unhealthy)"
                  : trend.direction === "improving"
                  ? "var(--aqi-good)"
                  : "var(--text-muted)",
            }}
          >
            {trend.direction === "worsening" ? "↑ " : trend.direction === "improving" ? "↓ " : "→ "}
            {trend.direction.charAt(0).toUpperCase() + trend.direction.slice(1)}
          </span>
        </div>

        <div className="data-row" style={{ border: "none" }}>
          <span className="data-label">Category</span>
          <span className="data-value" style={{ color: colorHex }}>{category}</span>
        </div>
      </div>
    </div>
  );
}
