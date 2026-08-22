"use client";

interface FreshnessIndicatorProps {
  observationTime?: string | null;
  generatedTime?: string | null;
  modelName?: string;
  modelVersion?: number;
}

function fmtUTC(ts?: string | null): string {
  if (!ts) return "—";
  return (
    new Date(ts).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
      hour12: false,
    }) + " UTC"
  );
}

const FORECAST_WINDOW_MS = 72 * 60 * 60 * 1000;

export function isHistoricalReplay(
  observationTime?: string | null,
  generatedTime?: string | null
): boolean {
  if (!observationTime || !generatedTime) return false;

  const observation = Date.parse(observationTime);
  const generated = Date.parse(generatedTime);

  return (
    Number.isFinite(observation) &&
    Number.isFinite(generated) &&
    generated - observation > FORECAST_WINDOW_MS
  );
}

export default function FreshnessIndicator({
  observationTime,
  generatedTime,
  modelName = "Random Forest",
  modelVersion = 1,
}: FreshnessIndicatorProps) {
  const historicalReplay = isHistoricalReplay(observationTime, generatedTime);

  return (
    <div
      className="freshness-bar"
      aria-label={historicalReplay ? "Historical forecast replay details" : "Forecast freshness details"}
    >
      <div className="freshness-item">
        <span className="freshness-label">
          {historicalReplay ? "Historical Observation" : "Observation"}
        </span>
        <span className="freshness-value">{fmtUTC(observationTime)}</span>
      </div>

      <div className="freshness-sep" />

      <div className="freshness-item">
        <span className="freshness-label">
          {historicalReplay ? "Replay Generated" : "Forecast Generated"}
        </span>
        <span className="freshness-value">{fmtUTC(generatedTime)}</span>
      </div>

      <div className="freshness-sep" />

      <div className="freshness-item">
        <span className="freshness-label">Model</span>
        <span className="freshness-value">
          {modelName} · Registry v{modelVersion}
        </span>
      </div>

      {historicalReplay && (
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
