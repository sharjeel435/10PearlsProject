"use client";

import { motion } from "motion/react";
import { getCardinalDirection } from "@/lib/aqi";

interface WindCompassProps {
  directionDegrees: number | null;
  speedKmh?: number | null;
}

export default function WindCompass({
  directionDegrees,
  speedKmh,
}: WindCompassProps) {
  const cardinal = getCardinalDirection(directionDegrees);
  const degrees = directionDegrees != null && Number.isFinite(directionDegrees) ? directionDegrees : 0;

  return (
    <div className="compass-wrapper">
      <div className="compass-svg-frame" title={`Wind Direction: ${degrees}° (${cardinal})`}>
        <svg viewBox="0 0 100 100" width="44" height="44" style={{ overflow: "visible" }}>
          {/* Compass outer ticks */}
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1.5" />
          <line x1="50" y1="8" x2="50" y2="14" stroke="var(--brand-primary)" strokeWidth="2" strokeLinecap="round" />
          <line x1="50" y1="86" x2="50" y2="92" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1.5" />
          <line x1="8" y1="50" x2="14" y2="50" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1.5" />
          <line x1="86" y1="50" x2="92" y2="50" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1.5" />

          {/* North indicator */}
          <text x="50" y="22" fill="var(--brand-primary)" fontSize="9" fontWeight="800" textAnchor="middle">
            N
          </text>

          {/* Needle group rotating to degrees */}
          <motion.g
            animate={{ rotate: degrees }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            style={{ originX: "50px", originY: "50px" }}
          >
            {/* Red/Primary North pointer */}
            <polygon points="50,26 44,50 56,50" fill="var(--brand-cyan)" />
            {/* South pointer */}
            <polygon points="50,74 44,50 56,50" fill="rgba(255, 255, 255, 0.3)" />
            {/* Pivot dot */}
            <circle cx="50" cy="50" r="4" fill="#070d10" stroke="var(--brand-cyan)" strokeWidth="1.5" />
          </motion.g>
        </svg>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
          <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
            {directionDegrees != null ? `${Math.round(directionDegrees)}°` : "—"}
          </span>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--brand-cyan)" }}>
            {cardinal}
          </span>
        </div>
        {speedKmh != null && (
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            {speedKmh.toFixed(1)} km/h
          </span>
        )}
      </div>
    </div>
  );
}
