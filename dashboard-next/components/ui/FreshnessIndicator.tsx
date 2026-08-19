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

export default function FreshnessIndicator({
  observationTime,
  generatedTime,
  modelName = "Random Forest",
  modelVersion = 1,
}: FreshnessIndicatorProps) {
  return (
    <div className="freshness-bar">
      <div className="freshness-item">
        <span className="freshness-label">Observation</span>
        <span className="freshness-value">{fmtUTC(observationTime)}</span>
      </div>

      <div className="freshness-sep" />

      <div className="freshness-item">
        <span className="freshness-label">Forecast Generated</span>
        <span className="freshness-value">{fmtUTC(generatedTime)}</span>
      </div>

      <div className="freshness-sep" />

      <div className="freshness-item">
        <span className="freshness-label">Model</span>
        <span className="freshness-value">
          {modelName} · Registry v{modelVersion}
        </span>
      </div>
    </div>
  );
}
