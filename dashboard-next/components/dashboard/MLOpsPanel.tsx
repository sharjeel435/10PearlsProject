"use client";

export default function MLOpsPanel() {
  const stages = [
    {
      name: "Open-Meteo",
      desc: "Hourly atmospheric APIs for Karachi, Lahore, and Islamabad. US AQI, PM2.5, PM10, NO2, SO2, CO, O3, weather vectors.",
      status: "ACTIVE",
    },
    {
      name: "Feature Pipeline",
      desc: "Scheduled hourly ingestion. Generates 354 engineered signals: rolling windows (3h–168h), lag checkpoints, cyclical harmonics, interaction terms.",
      status: "ACTIVE",
    },
    {
      name: "Hopsworks Feature Store",
      desc: "Feature group `aqi_features_v1` with explicit schemas, metadata tracking, and online/offline parity.",
      status: "CONNECTED",
    },
    {
      name: "Training Dataset",
      desc: "Chronological Parquet snapshot. 70% train (Aug 2022–May 2025), 15% validation, 15% untouched test partition.",
      status: "IMMUTABLE",
    },
    {
      name: "Model Registry",
      desc: "Joblib artifacts for Ridge and Random Forest. Keras model.keras for LSTM. SHA-256 checksums verified.",
      status: "VERIFIED",
    },
    {
      name: "Prediction API",
      desc: "FastAPI REST microservice serving multi-horizon forecasts (+24h, +48h, +72h) with artifact integrity checks.",
      status: "HEALTHY",
    },
    {
      name: "Next.js Dashboard",
      desc: "Vercel edge serving. Server-rendered data, client-side interaction. This interface.",
      status: "OPERATIONAL",
    },
  ];

  const statusColor = (s: string) => {
    const upper = s.toUpperCase();
    if (["ACTIVE", "CONNECTED", "VERIFIED", "HEALTHY", "OPERATIONAL"].includes(upper)) return "var(--aqi-good)";
    if (upper === "IMMUTABLE") return "var(--text-muted)";
    return "var(--aqi-moderate)";
  };

  return (
    <div>
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
            <p className="pipeline-stage-status" style={{ color: statusColor(stage.status) }}>
              {stage.status}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
