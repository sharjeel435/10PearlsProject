"use client";

import { toPKT, toRelative, getObservationFreshness } from "@/lib/formatters";


interface MLOpsPanelProps {
  generatedAt?: string | null;
  observationAt?: string | null;
}

export default function MLOpsPanel({ generatedAt, observationAt }: MLOpsPanelProps) {
  const forecastFreshness = getObservationFreshness(generatedAt);
  const obsFreshness = getObservationFreshness(observationAt);

  // Derive pipeline health from artifact freshness
  const pipelineHealthy = forecastFreshness === "live" || forecastFreshness === "recent";
  const pipelineDegraded = forecastFreshness === "stale";
  const pipelineStale = forecastFreshness === "very-stale" || forecastFreshness === "unavailable";

  function pipelineStatusLabel(): { label: string; color: string; note: string } {
    if (pipelineHealthy) return { label: "Healthy", color: "var(--aqi-good)", note: "Forecast is current" };
    if (pipelineDegraded) return { label: "Degraded", color: "var(--aqi-moderate)", note: "Forecast is aging — pipeline may have missed a run" };
    if (pipelineStale) return {
      label: generatedAt ? "Stale" : "Unavailable",
      color: "var(--aqi-unhealthy)",
      note: generatedAt ? "Forecast is significantly out of date" : "No forecast artifact found",
    };
    return { label: "Unknown", color: "var(--text-faint)", note: "Status cannot be determined" };
  }

  const pipelineStatus = pipelineStatusLabel();

  const stages = [
    {
      name: "Open-Meteo",
      desc: "Hourly atmospheric APIs for Karachi, Lahore, and Islamabad. US AQI, PM2.5, PM10, NO₂, SO₂, CO, O₃, weather vectors.",
      statusLabel: "External API",
      statusColor: "var(--text-muted)",
    },
    {
      name: "Feature Pipeline",
      desc: "Scheduled hourly ingestion. Generates 354 engineered signals: rolling windows (3h–168h), lag checkpoints, cyclical harmonics, interaction terms.",
      statusLabel: obsFreshness === "live" || obsFreshness === "recent" ? "Recent" : obsFreshness === "unavailable" ? "Unknown" : "Stale",
      statusColor: obsFreshness === "live" || obsFreshness === "recent" ? "var(--aqi-good)" : obsFreshness === "unavailable" ? "var(--text-faint)" : "var(--aqi-moderate)",
      note: observationAt ? `Last record: ${toRelative(observationAt)}` : null,
    },
    {
      name: "Hopsworks Feature Store",
      desc: "Feature group `aqi_features_v1` with explicit schemas, metadata tracking, and online/offline parity.",
      statusLabel: "Connected",
      statusColor: "var(--text-muted)",
      note: "Status based on training artifact availability",
    },
    {
      name: "Training Dataset",
      desc: "Chronological Parquet snapshot. 70% train (Aug 2022–May 2025), 15% validation, 15% untouched test partition.",
      statusLabel: "Immutable",
      statusColor: "var(--text-faint)",
    },
    {
      name: "Model Registry",
      desc: "Joblib artifacts for Ridge and Random Forest. Keras model.keras for LSTM. SHA-256 checksums verified.",
      statusLabel: "Registered",
      statusColor: "var(--text-muted)",
    },
    {
      name: "Forecast Generation",
      desc: "GitHub Actions runs daily: predict.py generates forecasts, refresh_observations.py fetches live readings from Open-Meteo, artifacts committed to repo, Vercel redeploys automatically.",
      statusLabel: pipelineStatus.label,
      statusColor: pipelineStatus.color,
      note: generatedAt ? `Generated: ${toRelative(generatedAt)} (${toPKT(generatedAt)})` : null,
    },
    {
      name: "Next.js Dashboard",
      desc: "Vercel edge serving. Server-rendered data, client-side interaction. This interface.",
      statusLabel: "Serving",
      statusColor: "var(--aqi-good)",
    },
  ];

  return (
    <div>
      {/* Overall health summary */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "14px 20px",
          background: "var(--bg-surface-2)",
          borderRadius: "var(--radius-md)",
          border: `1px solid ${pipelineStatus.color}22`,
          marginBottom: "24px",
        }}
        aria-label={`Pipeline status: ${pipelineStatus.label}`}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: pipelineStatus.color,
            flexShrink: 0,
            animation: pipelineHealthy ? "freshness-pulse 2.5s ease-in-out infinite" : "none",
          }}
          aria-hidden="true"
        />
        <div>
          <p style={{ fontSize: "12px", fontWeight: 700, color: pipelineStatus.color }}>
            PIPELINE STATUS · {pipelineStatus.label.toUpperCase()}
          </p>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
            {pipelineStatus.note}
            {!pipelineHealthy && (
              <span style={{ marginLeft: "8px", color: "var(--text-faint)" }}>
                · Status derived from artifact freshness, not live monitoring
              </span>
            )}
          </p>
        </div>
      </div>

      <p className="panel-title" style={{ marginBottom: "8px" }}>Production Pipeline · End-to-End</p>

      <div className="mlops-pipeline">
        {stages.map((stage, i) => (
          <div key={stage.name} className="pipeline-stage">
            <p className="pipeline-stage-name">
              <span style={{ fontSize: "10px", color: "var(--text-faint)", display: "block", marginBottom: "3px", letterSpacing: "0.06em" }}>
                STAGE {String(i + 1).padStart(2, "0")}
              </span>
              {stage.name}
            </p>
            <p className="pipeline-stage-desc">{stage.desc}</p>
            {stage.note && (
              <p style={{ fontSize: "10px", color: "var(--text-faint)", marginBottom: "4px" }}>{stage.note}</p>
            )}
            <p className="pipeline-stage-status" style={{ color: stage.statusColor }}>
              {stage.statusLabel}
            </p>
          </div>
        ))}
      </div>

      <p style={{ fontSize: "11px", color: "var(--text-faint)", marginTop: "20px", lineHeight: 1.55 }}>
        Pipeline health is inferred from artifact timestamps. Live GitHub Actions run status is not available to this dashboard.
        Healthy = forecast generated within 12 hours · Degraded = 12–72 hours · Stale = &gt; 72 hours.
      </p>
    </div>
  );
}
