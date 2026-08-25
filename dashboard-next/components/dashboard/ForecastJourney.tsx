"use client";

import { motion } from "motion/react";
import { getAQICategory, getCategoryHex, calculateTrend } from "@/lib/aqi";
import AnimatedNumber from "@/components/motion/AnimatedNumber";
import { toPKT } from "@/lib/formatters";

interface ForecastJourneyProps {
  currentAQI: number | null;
  forecast24h: number | null;
  forecast48h: number | null;
  forecast72h: number | null;
  timestamp24h?: string;
  timestamp48h?: string;
  timestamp72h?: string;
}

function formatShortTime(ts?: string): string {
  if (!ts) return "";
  return toPKT(ts);
}

export default function ForecastJourney({
  currentAQI,
  forecast24h,
  forecast48h,
  forecast72h,
  timestamp24h,
  timestamp48h,
  timestamp72h,
}: ForecastJourneyProps) {
  const cur  = currentAQI != null && Number.isFinite(currentAQI) ? currentAQI : 70;
  const f24  = forecast24h != null && Number.isFinite(forecast24h) ? forecast24h : cur;
  const f48  = forecast48h != null && Number.isFinite(forecast48h) ? forecast48h : f24;
  const f72  = forecast72h != null && Number.isFinite(forecast72h) ? forecast72h : f48;

  const trend72 = calculateTrend(cur, f72);

  const points = [
    {
      horizon: "NOW",
      aqi: cur,
      delta: null,
      time: "Current observation",
      isObserved: true,
    },
    {
      horizon: "+24H",
      aqi: f24,
      delta: Math.round(f24 - cur),
      time: formatShortTime(timestamp24h) || "+24h forecast",
      isObserved: false,
    },
    {
      horizon: "+48H",
      aqi: f48,
      delta: Math.round(f48 - f24),
      time: formatShortTime(timestamp48h) || "+48h forecast",
      isObserved: false,
    },
    {
      horizon: "+72H",
      aqi: f72,
      delta: Math.round(f72 - f48),
      time: formatShortTime(timestamp72h) || "+72h forecast",
      isObserved: false,
    },
  ];

  return (
    <div className="forecast-ribbon-section">
      {/* Header */}
      <div className="forecast-ribbon-header">
        <div className="forecast-ribbon-title-block">
          <p className="section-label">72-hour outlook</p>
          <h2 className="section-heading" style={{ fontSize: "clamp(22px, 2.5vw, 32px)" }}>
            Predictive Horizons
          </h2>
        </div>
        <p className="forecast-ribbon-disclaimer">
          Discrete multi-step forecasts (+24h, +48h, +72h). Line indicates progression trajectory, not interpolated hourly values.
        </p>
      </div>

      {/* Ribbon */}
      <div className="forecast-ribbon">
        {/* Connecting track line */}
        <div className="forecast-ribbon-track" />

        {points.map((pt, i) => {
          const cat = getAQICategory(pt.aqi);
          const hex = getCategoryHex(cat);
          const deltaClass =
            pt.delta === null
              ? ""
              : pt.delta > 0
              ? "delta-positive"
              : pt.delta < 0
              ? "delta-negative"
              : "delta-neutral";
          const deltaText =
            pt.delta === null
              ? null
              : pt.delta > 0
              ? `+${pt.delta}`
              : `${pt.delta}`;

          return (
            <motion.div
              key={pt.horizon}
              className="forecast-point"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="forecast-point-horizon">{pt.horizon}</p>

              {/* Marker dot */}
              <div
                className={`forecast-point-marker${pt.isObserved ? " observed" : ""}`}
                style={{ color: hex, borderColor: hex }}
              />

              {/* AQI value */}
              <p className="forecast-point-aqi tabular" style={{ color: hex }}>
                <AnimatedNumber value={Math.round(pt.aqi)} duration={0.45} />
              </p>

              <p className="forecast-point-category">{cat}</p>

              {/* Delta */}
              {deltaText && (
                <p className={`forecast-point-delta ${deltaClass}`}>
                  {deltaText} AQI
                </p>
              )}

              <p className="forecast-point-time">{pt.time}</p>
            </motion.div>
          );
        })}
      </div>

      {/* 72h summary strip */}
      <div className="forecast-summary-strip">
        <div className="forecast-summary-stat">
          <span className="forecast-summary-stat-label">72-Hour Change</span>
          <span
            className="forecast-summary-stat-val tabular"
            style={{
              color:
                trend72.direction === "worsening"
                  ? "var(--aqi-unhealthy)"
                  : trend72.direction === "improving"
                  ? "var(--aqi-good)"
                  : "var(--text-muted)",
            }}
          >
            {trend72.delta > 0 ? "+" : ""}
            {trend72.delta} AQI
          </span>
        </div>

        <div className="forecast-summary-sep" />

        <div className="forecast-summary-stat">
          <span className="forecast-summary-stat-label">Trend</span>
          <span
            className={`forecast-summary-stat-val direction-${trend72.direction}`}
          >
            {trend72.direction === "worsening"
              ? "Worsening"
              : trend72.direction === "improving"
              ? "Improving"
              : "Stable"}
          </span>
        </div>

        <div className="forecast-summary-sep" />

        <div className="forecast-summary-stat">
          <span className="forecast-summary-stat-label">Now</span>
          <span className="forecast-summary-stat-val tabular">{Math.round(cur)} AQI</span>
        </div>

        <div className="forecast-summary-sep" />

        <div className="forecast-summary-stat">
          <span className="forecast-summary-stat-label">At +72h</span>
          <span className="forecast-summary-stat-val tabular">{Math.round(f72)} AQI</span>
        </div>
      </div>
    </div>
  );
}
