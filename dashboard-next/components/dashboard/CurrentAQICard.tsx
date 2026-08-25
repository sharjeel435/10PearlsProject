"use client";

import { motion } from "motion/react";
import { getAQICategory, getCategoryHex } from "@/lib/aqi";
import { toPKT, toUTC, toRelative, getObservationFreshness, freshnessColor } from "@/lib/formatters";
import AnimatedNumber from "@/components/motion/AnimatedNumber";
import Tooltip from "@/components/ui/Tooltip";

interface CurrentAQICardProps {
  city: string;
  aqi: number | null;
  aqiIsObserved?: boolean; // true = real observation, false = forecast fallback
  observationTimestamp?: string | null;
  onExploreClick?: () => void;
}

export default function CurrentAQICard({
  city,
  aqi,
  aqiIsObserved = true,
  observationTimestamp,
  onExploreClick,
}: CurrentAQICardProps) {
  const numericAqi = aqi != null && Number.isFinite(aqi) ? aqi : 0;
  const category = aqi != null ? getAQICategory(numericAqi) : "Moderate";
  const colorHex = getCategoryHex(category);

  const freshness = getObservationFreshness(observationTimestamp);
  const isStale = freshness === "stale" || freshness === "very-stale";
  const freshnessHex = freshnessColor(freshness);

  return (
    <motion.div
      className="aqi-primary-block"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* City + observation label */}
      <p className="aqi-city-label">
        <span
          style={{
            display: "inline-block",
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: colorHex,
            flexShrink: 0,
            transition: "background 0.4s ease",
          }}
        />
        {city}, Pakistan
      </p>
      <p className="aqi-observation-label">
        {aqiIsObserved ? "Latest measured air quality" : "Most recent forecast AQI"}
      </p>

      {/* Staleness warning */}
      {isStale && aqiIsObserved && (
        <div
          className="aqi-stale-warning"
          role="alert"
          aria-live="polite"
        >
          <span style={{ color: "var(--aqi-moderate)" }}>⚠</span>
          {" "}Observation is {toRelative(observationTimestamp)} — forecast may not reflect current conditions
        </div>
      )}

      {/* Iconic AQI number */}
      <div className="aqi-number-display">
        <span
          className="aqi-huge-number tabular"
          style={{ color: aqi != null ? colorHex : "var(--text-faint)" }}
        >
          {aqi != null ? (
            <AnimatedNumber value={Math.round(numericAqi)} duration={0.5} />
          ) : (
            "—"
          )}
        </span>
        <Tooltip term="AQI">
          <span className="aqi-unit-label" style={{ alignSelf: "flex-end", marginBottom: "10px" }}>
            US AQI
          </span>
        </Tooltip>
      </div>

      {/* Category word */}
      <p
        className="aqi-category-word"
        style={{ color: aqi != null ? colorHex : "var(--text-muted)" }}
      >
        {category}
      </p>

      {/* Timestamp */}
      {observationTimestamp && (
        <p className="aqi-timestamp-line">
          <span>{aqiIsObserved ? "LAST OBSERVED" : "FORECAST FOR"}</span>
          <span className="aqi-timestamp-sep" />
          <span
            style={{ color: isStale ? "var(--aqi-moderate)" : "var(--text-muted)" }}
            title={`UTC: ${toUTC(observationTimestamp)}`}
          >
            {toPKT(observationTimestamp)}
          </span>
          <span className="aqi-timestamp-sep" />
          <span
            style={{
              color: isStale ? freshnessHex : "var(--text-faint)",
              fontSize: "10px",
            }}
          >
            {toRelative(observationTimestamp)}
          </span>
        </p>
      )}

      {/* Why link */}
      {onExploreClick && (
        <button
          onClick={onExploreClick}
          className="health-why-btn"
          style={{ marginTop: "20px", width: "fit-content" }}
        >
          Why this forecast? →
        </button>
      )}
    </motion.div>
  );
}
