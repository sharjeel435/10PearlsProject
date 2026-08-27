"use client";

import { toPKT, toRelative, getObservationFreshness } from "@/lib/formatters";

interface MLOpsPanelProps {
  generatedAt?: string | null;
  observationAt?: string | null;
}

// ── Inline SVG icons — no extra dependencies ─────────────────────────────────
function IconCloud() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 0 1 0 9Z" />
    </svg>
  );
}
function IconGear() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}
function IconDatabase() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}
function IconTable() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18" />
    </svg>
  );
}
function IconBox() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" />
    </svg>
  );
}
function IconPlay() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}
function IconMonitor() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

// ── Status → visual tokens ────────────────────────────────────────────────────
type StageStatus = "healthy" | "degraded" | "stale" | "neutral" | "immutable";

function statusTokens(s: StageStatus) {
  switch (s) {
    case "healthy":   return { color: "var(--aqi-good)",      bg: "rgba(16,185,129,0.10)",  border: "rgba(16,185,129,0.25)",  pulse: true  };
    case "degraded":  return { color: "var(--aqi-moderate)",  bg: "rgba(212,160,23,0.10)",  border: "rgba(212,160,23,0.25)",  pulse: false };
    case "stale":     return { color: "var(--aqi-unhealthy)", bg: "rgba(224,82,82,0.10)",   border: "rgba(224,82,82,0.25)",   pulse: false };
    case "immutable": return { color: "#4a9ebe",              bg: "rgba(74,158,190,0.10)",  border: "rgba(74,158,190,0.25)",  pulse: false };
    default:          return { color: "var(--text-muted)",    bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.08)", pulse: false };
  }
}

export default function MLOpsPanel({ generatedAt, observationAt }: MLOpsPanelProps) {
  const forecastFreshness = getObservationFreshness(generatedAt);
  const obsFreshness      = getObservationFreshness(observationAt);

  const pipelineHealthy  = forecastFreshness === "live" || forecastFreshness === "recent";
  const pipelineDegraded = forecastFreshness === "stale";
  const pipelineStale    = forecastFreshness === "very-stale" || forecastFreshness === "unavailable";

  function pipelineStatus(): { label: string; status: StageStatus; note: string } {
    if (pipelineHealthy)  return { label: "Healthy",   status: "healthy",   note: "Forecast is current" };
    if (pipelineDegraded) return { label: "Degraded",  status: "degraded",  note: "Forecast aging — pipeline may have missed a run" };
    if (pipelineStale)    return {
      label: generatedAt ? "Stale" : "Unavailable",
      status: "stale",
      note: generatedAt ? "Forecast is significantly out of date" : "No forecast artifact found",
    };
    return { label: "Unknown", status: "neutral", note: "Status cannot be determined" };
  }

  const ps     = pipelineStatus();
  const psTok  = statusTokens(ps.status);

  const obsStatus: StageStatus =
    obsFreshness === "live" || obsFreshness === "recent" ? "healthy"
    : obsFreshness === "unavailable" ? "neutral"
    : "degraded";

  type Stage = {
    id: string; label: string; name: string; desc: string;
    statusLabel: string; status: StageStatus;
    note?: string | null;
    Icon: React.ComponentType;
  };

  const stages: Stage[] = [
    {
      id: "01", label: "Data Source",   name: "Open-Meteo",
      desc: "Hourly atmospheric APIs for Karachi, Lahore, and Islamabad. US AQI, PM2.5, PM10, NO₂, SO₂, CO, O₃, weather vectors.",
      statusLabel: "External API", status: "neutral", Icon: IconCloud,
    },
    {
      id: "02", label: "Ingestion",     name: "Feature Pipeline",
      desc: "Scheduled hourly ingestion. Generates 354 engineered signals: rolling windows (3h–168h), lag checkpoints, cyclical harmonics, interaction terms.",
      statusLabel: obsStatus === "healthy" ? "Recent" : obsStatus === "neutral" ? "Unknown" : "Stale",
      status: obsStatus,
      note: observationAt ? `Last record: ${toRelative(observationAt)}` : null,
      Icon: IconGear,
    },
    {
      id: "03", label: "Feature Store", name: "Hopsworks Feature Store",
      desc: "Feature group `aqi_features_v1` with explicit schemas, metadata tracking, and online/offline parity.",
      statusLabel: "Connected", status: "neutral",
      note: "Status based on training artifact availability",
      Icon: IconDatabase,
    },
    {
      id: "04", label: "Dataset",       name: "Training Dataset",
      desc: "Chronological Parquet snapshot. 70% train (Aug 2022–May 2025), 15% validation, 15% untouched test partition.",
      statusLabel: "Immutable", status: "immutable", Icon: IconTable,
    },
    {
      id: "05", label: "Registry",      name: "Model Registry",
      desc: "Joblib artifacts for Ridge and Random Forest. Keras model.keras for LSTM. SHA-256 checksums verified.",
      statusLabel: "Registered", status: "neutral", Icon: IconBox,
    },
    {
      id: "06", label: "Generation",    name: "Forecast Generation",
      desc: "GitHub Actions runs daily: predict.py generates forecasts, refresh_observations.py fetches live readings from Open-Meteo, artifacts committed to repo, Vercel redeploys automatically.",
      statusLabel: ps.label, status: ps.status,
      note: generatedAt ? `Generated: ${toRelative(generatedAt)} (${toPKT(generatedAt)})` : null,
      Icon: IconPlay,
    },
    {
      id: "07", label: "Dashboard",     name: "Next.js Dashboard",
      desc: "Vercel edge serving. Server-rendered data, client-side interaction. This interface.",
      statusLabel: "Serving", status: "healthy", Icon: IconMonitor,
    },
  ];

  return (
    <div>
      {/* ── Overall health bar ──────────────────────────────────── */}
      <div
        style={{
          display: "flex", alignItems: "center", gap: "12px",
          padding: "13px 18px",
          background: psTok.bg,
          border: `1px solid ${psTok.border}`,
          borderRadius: "var(--radius-md)",
          marginBottom: "28px",
        }}
        aria-label={`Pipeline status: ${ps.label}`}
      >
        <span
          style={{
            width: 8, height: 8, borderRadius: "50%",
            background: psTok.color, flexShrink: 0,
            boxShadow: pipelineHealthy ? `0 0 8px ${psTok.color}55` : "none",
            animation: pipelineHealthy ? "freshness-pulse 2.5s ease-in-out infinite" : "none",
          }}
          aria-hidden="true"
        />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: psTok.color, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Pipeline Status · {ps.label}
          </p>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
            {ps.note}
            {!pipelineHealthy && (
              <span style={{ marginLeft: "8px", color: "var(--text-faint)" }}>
                · Inferred from artifact timestamps
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ── Section title ─────────────────────────────────────────── */}
      <p className="panel-title" style={{ marginBottom: "22px" }}>Production Pipeline · End-to-End</p>

      {/* ── Vertical stepper ──────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {stages.map((stage, i) => {
          const tok    = statusTokens(stage.status);
          const isLast = i === stages.length - 1;

          return (
            <div key={stage.id} style={{ display: "flex", gap: "14px" }}>
              {/* Left column: icon node + connector line */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: "32px" }}>
                {/* Icon node */}
                <div style={{
                  position: "relative",
                  width: "32px", height: "32px", borderRadius: "50%",
                  background: tok.bg,
                  border: `1px solid ${tok.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: tok.color, flexShrink: 0, zIndex: 1,
                }}>
                  <stage.Icon />
                  {/* Pulse ring for live stages */}
                  {tok.pulse && (
                    <span style={{
                      position: "absolute", inset: "-5px",
                      borderRadius: "50%",
                      border: `1px solid ${tok.color}`,
                      opacity: 0.35,
                      animation: "freshness-pulse 2.5s ease-in-out infinite",
                      pointerEvents: "none",
                    }} aria-hidden="true" />
                  )}
                </div>
                {/* Connector line */}
                {!isLast && (
                  <div style={{
                    width: "1px", flex: 1, minHeight: "20px",
                    background: "linear-gradient(to bottom, var(--border-subtle), var(--border-faint))",
                    margin: "4px 0",
                  }} />
                )}
              </div>

              {/* Right column: content */}
              <div style={{ flex: 1, paddingBottom: isLast ? 0 : "22px", paddingTop: "4px" }}>
                {/* Row: stage meta + status badge */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "5px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "9px", fontWeight: 700, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                      STAGE {stage.id}
                    </span>
                    <span style={{ color: "var(--border-medium)", fontSize: "9px" }}>·</span>
                    <span style={{ fontSize: "9px", fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      {stage.label}
                    </span>
                  </div>
                  {/* Status badge */}
                  <span style={{
                    fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                    color: tok.color, background: tok.bg, border: `1px solid ${tok.border}`,
                    borderRadius: "4px", padding: "2px 8px",
                    display: "inline-flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap",
                  }}>
                    <span style={{
                      width: 5, height: 5, borderRadius: "50%", background: tok.color, flexShrink: 0,
                      animation: tok.pulse ? "freshness-pulse 2.5s ease-in-out infinite" : "none",
                    }} aria-hidden="true" />
                    {stage.statusLabel}
                  </span>
                </div>

                {/* Stage name */}
                <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em", marginBottom: "4px" }}>
                  {stage.name}
                </p>

                {/* Description */}
                <p style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.65 }}>
                  {stage.desc}
                </p>

                {/* Timestamp / note */}
                {stage.note && (
                  <p style={{ fontSize: "10px", color: "var(--text-faint)", marginTop: "5px" }}>
                    {stage.note}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Footer legend ──────────────────────────────────────────── */}
      <p style={{ fontSize: "10px", color: "var(--text-faint)", marginTop: "24px", lineHeight: 1.65 }}>
        Pipeline health is inferred from artifact timestamps — live GitHub Actions run status is not available to this dashboard.{" "}
        <span style={{ color: "var(--aqi-good)" }}>Healthy</span> = &lt;12 h ·{" "}
        <span style={{ color: "var(--aqi-moderate)" }}>Degraded</span> = 12–72 h ·{" "}
        <span style={{ color: "var(--aqi-unhealthy)" }}>Stale</span> = &gt;72 h
      </p>
    </div>
  );
}
