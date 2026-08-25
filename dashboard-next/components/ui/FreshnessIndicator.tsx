"use client";

import {
  toPKT,
  toUTC,
  toRelative,
  getObservationFreshness,
  freshnessColor,
  freshnessLabel,
  type FreshnessState,
} from "@/lib/formatters";

interface FreshnessIndicatorProps {
  observationTime?: string | null;
  generatedTime?: string | null;
  modelName?: string;
  modelVersion?: number;
}

export function isHistoricalReplay(
  observationTime?: string | null,
  generatedTime?: string | null
): boolean {
  if (!observationTime || !generatedTime) return false;
  const observation = Date.parse(observationTime);
  const generated = Date.parse(generatedTime);
  const FORECAST_WINDOW_MS = 72 * 60 * 60 * 1000;
  return (
    Number.isFinite(observation) &&
    Number.isFinite(generated) &&
    generated - observation > FORECAST_WINDOW_MS
  );
}

function FreshnessDot({ state }: { state: FreshnessState }) {
  const color = freshnessColor(state);
  const isLive = state === "live" || state === "recent";
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: color,
        flexShrink: 0,
        animation: isLive ? "freshness-pulse 2.5s ease-in-out infinite" : "none",
      }}
    />
  );
}

export default function FreshnessIndicator({
  observationTime,
  generatedTime,
  modelName = "Random Forest",
  modelVersion = 1,
}: FreshnessIndicatorProps) {
  const obsFreshness = getObservationFreshness(observationTime);
  const forecastFreshness = getObservationFreshness(generatedTime);
  const isStale = obsFreshness === "stale" || obsFreshness === "very-stale";
  const historicalReplay = isHistoricalReplay(observationTime, generatedTime);

  return (
    <div
      className={`freshness-bar${isStale ? " freshness-bar-stale" : ""}`}
      aria-label="Data freshness details"
    >
      {/* Observation freshness */}
      <div className="freshness-item">
        <span className="freshness-label">
          {historicalReplay ? "Historical Observation" : "Observation"}
        </span>
        <span className="freshness-value" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <FreshnessDot state={obsFreshness} />
          <span title={toUTC(observationTime)}>
            {observationTime ? toRelative(observationTime) : "—"}
          </span>
          {observationTime && (
            <span style={{ color: "var(--text-faint)", fontSize: "10px" }}>
              ({toPKT(observationTime)})
            </span>
          )}
        </span>
      </div>

      <div className="freshness-sep" />

      {/* Forecast generated */}
      <div className="freshness-item">
        <span className="freshness-label">Forecast Updated</span>
        <span className="freshness-value" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <FreshnessDot state={forecastFreshness} />
          <span title={toUTC(generatedTime)}>
            {generatedTime ? toRelative(generatedTime) : "—"}
          </span>
          {generatedTime && (
            <span style={{ color: "var(--text-faint)", fontSize: "10px" }}>
              ({toPKT(generatedTime)})
            </span>
          )}
        </span>
      </div>

      <div className="freshness-sep" />

      {/* Model */}
      <div className="freshness-item">
        <span className="freshness-label">Production Model</span>
        <span className="freshness-value">
          {modelName} · v{modelVersion}
        </span>
      </div>

      {/* Stale warning */}
      {isStale && (
        <span
          className="freshness-stale-badge"
          title="Observation data is older than expected. The forecast was generated from an earlier observation."
        >
          ⚠ Observation data stale — {freshnessLabel(obsFreshness)}
        </span>
      )}

      {historicalReplay && !isStale && (
        <span
          className="freshness-context"
          title="This is a reproducible historical forecast run, not a live forecast."
        >
          Historical replay
        </span>
      )}
    </div>
  );
}
