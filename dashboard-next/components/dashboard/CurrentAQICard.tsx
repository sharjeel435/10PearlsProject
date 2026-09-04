"use client";

import { motion } from "motion/react";
import { getAQICategory, getCategoryHex } from "@/lib/aqi";
import { toPKT, toUTC, toRelative, getObservationFreshness, freshnessColor } from "@/lib/formatters";
import AnimatedNumber from "@/components/motion/AnimatedNumber";
import Tooltip from "@/components/ui/Tooltip";

/** Map AQI (0–500) to a 0–1 fill fraction for the ring. */
function aqiFraction(value: number): number {
  return Math.min(Math.max(value, 0), 500) / 500;
}

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

      {/* AQI Ring Gauge */}
      {(() => {
        const SIZE = 200;           // SVG viewport size
        const STROKE = 14;          // ring thickness
        const R = (SIZE - STROKE) / 2;  // radius
        const CIRC = 2 * Math.PI * R;
        const fraction = aqiFraction(numericAqi);
        const dashOffset = CIRC * (1 - (aqi != null ? fraction : 0));

        return (
          <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: SIZE, height: SIZE, marginBottom: 4 }}>
            <svg
              width={SIZE}
              height={SIZE}
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}
              aria-hidden="true"
            >
              {/* Track ring */}
              <circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                fill="none"
                stroke="rgba(255,255,255,0.07)"
                strokeWidth={STROKE}
                strokeLinecap="round"
              />
              {/* Filled arc */}
              <circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                fill="none"
                stroke={aqi != null ? colorHex : "var(--text-faint)"}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={dashOffset}
                style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1), stroke 0.4s ease" }}
              />
            </svg>

            {/* Number + unit centred inside ring */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, zIndex: 1 }}>
              <span
                className="aqi-huge-number tabular"
                style={{ color: aqi != null ? colorHex : "var(--text-faint)", fontSize: "clamp(54px, 8vw, 84px)" }}
              >
                {aqi != null ? (
                  <AnimatedNumber value={Math.round(numericAqi)} duration={0.5} />
                ) : (
                  "—"
                )}
              </span>
              <Tooltip term="AQI">
                <span className="aqi-unit-label" style={{ marginBottom: 0, fontSize: "11px" }}>
                  US AQI
                </span>
              </Tooltip>
            </div>
          </div>
        );
      })()}

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
