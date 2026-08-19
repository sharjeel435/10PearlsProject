"use client";

import { getAQICategory, getCategoryGuidance, calculateTrend, getCategoryHex } from "@/lib/aqi";
import Tooltip from "@/components/ui/Tooltip";

interface HealthIntelligenceCardProps {
  currentAQI: number | null;
  forecast72hAQI: number | null;
  primaryPollutant?: string;
}

export default function HealthIntelligenceCard({
  currentAQI,
  forecast72hAQI,
  primaryPollutant = "PM2.5",
}: HealthIntelligenceCardProps) {
  const numericAqi = currentAQI != null && Number.isFinite(currentAQI) ? currentAQI : 75;
  const category = getAQICategory(numericAqi);
  const guidance = getCategoryGuidance(category);
  const colorHex = getCategoryHex(category);

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
          <span className="data-label">Primary Concern</span>
          <span className="data-value">
            <Tooltip term="PM2.5">
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
