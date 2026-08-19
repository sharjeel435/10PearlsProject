"use client";

import { motion } from "motion/react";
import { getAQICategory, getCategoryHex, getCategoryGuidance } from "@/lib/aqi";
import AnimatedNumber from "@/components/motion/AnimatedNumber";
import Tooltip from "@/components/ui/Tooltip";

interface CurrentAQICardProps {
  city: string;
  aqi: number | null;
  observationTimestamp?: string | null;
  onExploreClick?: () => void;
}

export default function CurrentAQICard({
  city,
  aqi,
  observationTimestamp,
  onExploreClick,
}: CurrentAQICardProps) {
  const numericAqi = aqi != null && Number.isFinite(aqi) ? aqi : 0;
  const category = aqi != null ? getAQICategory(numericAqi) : "Moderate";
  const colorHex = getCategoryHex(category);

  const formattedDate = observationTimestamp
    ? new Date(observationTimestamp).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      })
    : null;

  const formattedTime = observationTimestamp
    ? new Date(observationTimestamp).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
        hour12: false,
      }) + " UTC"
    : null;

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
      <p className="aqi-observation-label">Current observed air quality</p>

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
      {(formattedDate || formattedTime) && (
        <p className="aqi-timestamp-line">
          <span>LAST OBSERVED</span>
          <span className="aqi-timestamp-sep" />
          {formattedDate && (
            <span style={{ color: "var(--text-muted)" }}>{formattedDate}</span>
          )}
          {formattedDate && formattedTime && (
            <span className="aqi-timestamp-sep" />
          )}
          {formattedTime && (
            <span style={{ color: "var(--text-muted)" }}>{formattedTime}</span>
          )}
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
