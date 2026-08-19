export default function Loading() {
  return (
    <main style={{ minHeight: "100vh", padding: "40px 4vw", maxWidth: "1440px", margin: "0 auto" }} aria-live="polite">
      {/* Header skeleton */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "36px" }}>
        <div className="skeleton" style={{ width: "160px", height: "36px" }} />
        <div style={{ display: "flex", gap: "10px" }}>
          <div className="skeleton" style={{ width: "90px", height: "36px" }} />
          <div className="skeleton" style={{ width: "90px", height: "36px" }} />
          <div className="skeleton" style={{ width: "90px", height: "36px" }} />
        </div>
      </div>

      {/* Hero skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "20px", marginBottom: "24px" }}>
        <div className="skeleton" style={{ height: "300px" }} />
        <div className="skeleton" style={{ height: "300px" }} />
      </div>

      {/* Forecast cards skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
        <div className="skeleton" style={{ height: "180px" }} />
        <div className="skeleton" style={{ height: "180px" }} />
        <div className="skeleton" style={{ height: "180px" }} />
        <div className="skeleton" style={{ height: "180px" }} />
      </div>

      {/* Chart skeleton */}
      <div className="skeleton" style={{ height: "320px", width: "100%" }} />

      <div style={{ textAlign: "center", marginTop: "24px", color: "var(--text-muted)", fontSize: "13px" }}>
        Loading verified atmospheric telemetry and ML models…
      </div>
    </main>
  );
}
