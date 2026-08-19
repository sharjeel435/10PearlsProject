import SiteHeader from "@/components/SiteHeader";

const principles = [
  {
    title: "No Data Fabrication",
    desc: "If live or historical telemetry is unavailable, the UI presents an explicit unavailable state. We never generate synthetic placeholder measurements.",
  },
  {
    title: "Honest R² Labeling",
    desc: "R² is strictly reported as the coefficient of determination (goodness of fit). We never present regression R² as classification accuracy.",
  },
  {
    title: "Discrete Horizons",
    desc: "Predictions are generated exclusively at +24h, +48h, and +72h intervals. Connecting curves are visual guides, not continuous hourly forecasts.",
  },
];

const stack = [
  { name: "Open-Meteo",     role: "Atmospheric API · Hourly telemetry" },
  { name: "Hopsworks",      role: "Feature Store · aqi_features_v1" },
  { name: "scikit-learn",   role: "Random Forest regressor · Joblib artifacts" },
  { name: "SHAP",           role: "TreeExplainer · Global feature importance" },
  { name: "FastAPI",        role: "Type-safe inference microservice" },
  { name: "Next.js 16",     role: "Edge visualization dashboard" },
];

export default function AboutPage() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <SiteHeader />

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "72px 4vw 96px", width: "100%" }}>

        {/* Hero */}
        <div style={{ marginBottom: "72px" }}>
          <p className="section-label">About Pearls Air Intelligence</p>
          <h1 className="section-heading" style={{ marginBottom: "12px" }}>
            Environmental Intelligence With Receipts.
          </h1>
          <p className="section-description" style={{ fontSize: "16px" }}>
            An independently audited, open machine-learning system providing 72-hour air quality predictions across Karachi, Lahore, and Islamabad.
          </p>
        </div>

        {/* What it is / what it isn't */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0", borderTop: "1px solid var(--border-faint)", marginBottom: "64px" }}>
          <div style={{ padding: "32px 32px 32px 0", borderRight: "1px solid var(--border-faint)" }}>
            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: "var(--aqi-good)", textTransform: "uppercase", marginBottom: "12px" }}>
              What This Is
            </p>
            <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: "10px" }}>
              A complete ML observability system
            </h2>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.65 }}>
              A high-precision operational interface atop a complete Python ML ecosystem: Open-Meteo atmospheric ingestion, Hopsworks Feature Store versioning, scikit-learn Random Forest regression, SHAP tree explainers, FastAPI edge endpoints, and automated GitHub Actions workflows.
            </p>
          </div>
          <div style={{ padding: "32px 0 32px 32px" }}>
            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: "var(--aqi-sensitive)", textTransform: "uppercase", marginBottom: "12px" }}>
              What This Is Not
            </p>
            <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: "10px" }}>
              Not a regulatory monitoring agency
            </h2>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.65 }}>
              It is not an official government regulatory monitoring agency or an emergency disaster alert system. Multi-horizon atmospheric forecasts contain physical uncertainty and should be used as predictive decision intelligence alongside local meteorological advisories.
            </p>
          </div>
        </div>

        {/* Scientific Principles */}
        <div style={{ marginBottom: "64px" }}>
          <p className="section-label" style={{ marginBottom: "28px" }}>Scientific principles</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {principles.map((p, i) => (
              <div key={p.title} style={{ display: "grid", gridTemplateColumns: "32px 1fr", gap: "24px", padding: "20px 0", borderBottom: "1px solid var(--border-faint)" }}>
                <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-faint)", letterSpacing: "-0.03em" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em", marginBottom: "6px" }}>
                    {p.title}
                  </h3>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.65 }}>{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technology Stack */}
        <div>
          <p className="section-label" style={{ marginBottom: "24px" }}>Production technology stack</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0", borderTop: "1px solid var(--border-faint)", borderLeft: "1px solid var(--border-faint)" }}>
            {stack.map((s) => (
              <div
                key={s.name}
                style={{
                  padding: "18px 20px",
                  borderRight: "1px solid var(--border-faint)",
                  borderBottom: "1px solid var(--border-faint)",
                }}
              >
                <strong style={{ fontSize: "13px", color: "var(--text-primary)", display: "block", marginBottom: "3px", letterSpacing: "-0.01em" }}>
                  {s.name}
                </strong>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{s.role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="site-footer" style={{ marginTop: "auto" }}>
        <span className="footer-brand">PEARLS AIR INTELLIGENCE</span>
        <span>Real data · Honest metrics · Observable ML</span>
      </footer>
    </main>
  );
}
