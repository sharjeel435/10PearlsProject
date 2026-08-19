import React from "react";
import { Loader2, AlertTriangle, FileQuestion } from "lucide-react";

export default function ForecastState({
  state,
}: {
  state: "loading" | "empty" | "error";
}) {
  const stateConfig = {
    loading: {
      title: "Loading Verified Air Quality Data",
      description: "Fetching verified atmospheric measurements and ML model predictions from repository artifacts…",
      icon: <Loader2 size={24} className="animate-spin" style={{ color: "var(--brand-primary)" }} />,
      badge: "DATA INGESTION",
    },
    empty: {
      title: "Forecast Not Available",
      description: "No verified multi-horizon forecast data was found for this location. We do not show synthetic placeholder values.",
      icon: <FileQuestion size={24} style={{ color: "var(--text-muted)" }} />,
      badge: "NO ARTIFACT",
    },
    error: {
      title: "Service Temporarily Unavailable",
      description: "Unable to reach the prediction service or load verified artifacts. Please retry in a few moments.",
      icon: <AlertTriangle size={24} style={{ color: "var(--aqi-unhealthy)" }} />,
      badge: "NETWORK STATE",
    },
  }[state];

  return (
    <section
      role="status"
      aria-live="polite"
      className="card-base"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        textAlign: "center",
        minHeight: "220px",
        gap: "12px",
      }}
    >
      <div style={{ marginBottom: "4px" }}>
        {stateConfig.icon}
      </div>
      <span className="badge neutral" style={{ fontSize: "10px" }}>
        {stateConfig.badge}
      </span>
      <strong style={{ fontSize: "18px", color: "var(--text-primary)" }}>
        {stateConfig.title}
      </strong>
      <span style={{ fontSize: "13px", color: "var(--text-secondary)", maxWidth: "420px", lineHeight: 1.5 }}>
        {stateConfig.description}
      </span>
    </section>
  );
}
