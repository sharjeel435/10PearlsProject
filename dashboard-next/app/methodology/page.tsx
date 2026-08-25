import SiteHeader from "@/components/SiteHeader";

const stages = [
  { num: "01", title: "Open-Meteo Ingest",     sub: "Hourly weather & AQI",     detail: "Collects 4 years of hourly records for Karachi, Lahore, and Islamabad. Ingests US AQI, PM2.5, PM10, NO₂, SO₂, CO, O₃, temperature, humidity, wind vectors, pressure, and rain." },
  { num: "02", title: "Data Sanitization",      sub: "Bounds + deduplication",   detail: "Enforces non-negative physical bounds, handles missing data via backward-looking forward-fill, and verifies 0 duplicate keys across 105,912 timestamps." },
  { num: "03", title: "Feature Engineering",    sub: "354 mathematical signals",  detail: "Generates trailing rolling windows (3h–168h), lag checkpoints, cyclical harmonic angles (sin/cos), thermodynamic ratios, and inversion episodes strictly backward in time." },
  { num: "04", title: "Hopsworks Feature Store", sub: "Versioned feature group",   detail: "Stores curated features under aqi_features_v1 with explicit schemas, metadata tracking, and online/offline parity." },
  { num: "05", title: "Chronological Split",    sub: "70 / 15 / 15 chrono",      detail: "Partitions 105,912 records chronologically: Train (Aug 2022–May 2025), Validation (May 2025–Dec 2025), and Untouched Test (Dec 2025–Aug 2026)." },
  { num: "06", title: "Model Tournament",       sub: "5 candidate architectures", detail: "Trains Ridge, Random Forest, LSTM (and baselines) across +24h, +48h, and +72h horizons. Random Forest selected on overall validation RMSE." },
  { num: "07", title: "FastAPI Inference",      sub: "SHA-256 verified endpoint", detail: "Serves low-latency multi-horizon AQI forecasts via FastAPI with SHA-256 artifact checksums and structured validation." },
  { num: "08", title: "Next.js Dashboard",      sub: "This interface",            detail: "Renders forecast intelligence, health guidance, SHAP explainability, and full technical receipts. Rebuilt as statically generated, revalidating every 30 minutes." },
];

const pillars = [
  {
    title: "Data Foundation",
    desc: "Karachi, Lahore, and Islamabad each contribute exactly 35,304 continuous hourly observations aligned on UTC timestamps from August 1, 2022 to August 10, 2026.",
    note: "0 missing timestamps · 0 duplicate keys · Continuous hourly resolution",
  },
  {
    title: "Leakage Prevention",
    desc: "Time flows strictly forward. All feature transformations, rolling statistics, and scalers are fit exclusively on historical training partitions to prevent data leakage.",
    note: "Strict municipal isolation · Train-only scaling · Chronological split",
  },
  {
    title: "354 Predictors",
    desc: "Combines immediate atmospheric signals with temporal memory: rolling windows (3h–168h), lag checkpoints, cyclical solar cycles, and boundary-layer temperature inversions.",
    note: "9 feature families · TreeExplainer global SHAP ranking",
  },
  {
    title: "Honest Evaluation",
    desc: "Model selection was finalized strictly using validation RMSE. The test partition was evaluated only after model selection was locked. R² is never mislabeled as classification accuracy.",
    note: "Honest metrics · Observable degradation over horizon · No inflated claims",
  },
];

export default function MethodologyPage() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <SiteHeader />

      <div style={{ maxWidth: "1500px", margin: "0 auto", padding: "72px 4vw 96px", width: "100%" }}>

        {/* ─── Hero ─── */}
        <div style={{ marginBottom: "64px" }}>
          <p className="section-label">End-to-end pipeline</p>
          <h1 className="section-heading" style={{ marginBottom: "12px" }}>
            From Atmospheric Signals<br />to Forecast Intelligence
          </h1>
          <p className="section-description">
            A reproducible, leakage-safe pipeline transforming 4 years of raw meteorological measurements into 72-hour air quality predictions, fully automated via GitHub Actions.
          </p>
        </div>

        {/* ─── Visual Pipeline Diagram ─── */}
        <div style={{ marginBottom: "64px" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: "var(--text-faint)", textTransform: "uppercase", marginBottom: "20px" }}>
            System Architecture · 8-Stage Pipeline
          </p>

          {/* Horizontal flow on large screens */}
          <div style={{ overflowX: "auto", paddingBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "stretch", gap: "0", minWidth: "900px" }}>
              {stages.map((st, i) => (
                <div key={st.num} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                  {/* Stage box */}
                  <div style={{
                    flex: 1,
                    background: "var(--bg-surface-1)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    padding: "16px 14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    minHeight: "96px",
                    position: "relative",
                  }}>
                    <span style={{ fontSize: "10px", fontWeight: 800, color: "var(--text-faint)", letterSpacing: "0.06em" }}>
                      {st.num}
                    </span>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em", lineHeight: 1.2 }}>
                      {st.title}
                    </span>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", lineHeight: 1.35 }}>
                      {st.sub}
                    </span>
                  </div>
                  {/* Arrow connector */}
                  {i < stages.length - 1 && (
                    <div style={{ color: "var(--text-faint)", fontSize: "16px", padding: "0 4px", flexShrink: 0 }}>
                      →
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontSize: "11px", color: "var(--text-faint)", marginTop: "12px" }}>
            8-stage end-to-end pipeline · Automated by GitHub Actions · Feature ingestion runs hourly · Forecast regenerated daily
          </p>
        </div>

        {/* ─── Detailed Stage List ─── */}
        <div style={{ marginBottom: "72px" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: "var(--text-faint)", textTransform: "uppercase", marginBottom: "4px" }}>
            Stage details
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {stages.map((st) => (
              <div
                key={st.num}
                style={{
                  display: "grid",
                  gridTemplateColumns: "64px 200px 1fr",
                  gap: "32px",
                  alignItems: "start",
                  padding: "24px 0",
                  borderBottom: "1px solid var(--border-faint)",
                }}
              >
                <span style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.04em", color: "var(--text-faint)", lineHeight: 1 }}>
                  {st.num}
                </span>
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em", marginBottom: "4px" }}>
                    {st.title}
                  </h3>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.02em" }}>
                    {st.sub}
                  </span>
                </div>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.65 }}>
                  {st.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── 4 Technical Guarantee Pillars ─── */}
        <div>
          <p className="section-label" style={{ marginBottom: "32px" }}>Technical guarantees</p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "0",
              borderTop: "1px solid var(--border-faint)",
              borderLeft: "1px solid var(--border-faint)",
            }}
          >
            {pillars.map((p) => (
              <div
                key={p.title}
                style={{
                  padding: "32px",
                  borderRight: "1px solid var(--border-faint)",
                  borderBottom: "1px solid var(--border-faint)",
                }}
              >
                <h3 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: "10px" }}>
                  {p.title}
                </h3>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.65, marginBottom: "16px" }}>
                  {p.desc}
                </p>
                <p style={{ fontSize: "11px", color: "var(--aqi-good)", fontWeight: 600, letterSpacing: "-0.01em" }}>
                  ✓ {p.note}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

      <footer className="site-footer" style={{ marginTop: "auto" }}>
        <span className="footer-brand">PEARLS AIR INTELLIGENCE</span>
        <span>Methodology &amp; Architecture Specification v1</span>
      </footer>
    </main>
  );
}
