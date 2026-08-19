import SiteHeader from "@/components/SiteHeader";
import { loadDashboardData } from "@/lib/data";
import { formatFeatureName } from "@/lib/aqi";

const MODEL_NAMES: Record<string, string> = {
  aqi_random_forest:    "Random Forest",
  aqi_ridge:            "Ridge Regression",
  persistence:          "Current Persistence",
  seasonal_persistence: "Seasonal Persistence",
  aqi_lstm:             "TensorFlow LSTM",
};

export default async function ModelsPage() {
  const d = await loadDashboardData();

  const testOverall    = d.cityMetrics.filter((x: any) => x.model === "aqi_random_forest" && x.city === "overall");
  const testKarachi    = d.cityMetrics.filter((x: any) => x.model === "aqi_random_forest" && x.city === "Karachi");
  const testLahore     = d.cityMetrics.filter((x: any) => x.model === "aqi_random_forest" && x.city === "Lahore");
  const testIslamabad  = d.cityMetrics.filter((x: any) => x.model === "aqi_random_forest" && x.city === "Islamabad");

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <SiteHeader />

      <div style={{ maxWidth: "1500px", margin: "0 auto", padding: "72px 4vw 96px", width: "100%" }}>

        {/* Hero */}
        <div style={{ marginBottom: "56px" }}>
          <p className="section-label">Model observability & benchmarks</p>
          <h1 className="section-heading" style={{ marginBottom: "12px" }}>
            Model Performance &amp; Evaluation
          </h1>
          <p className="section-description">
            Random Forest was selected exclusively using validation partition RMSE. The chronological test split remained untouched until selection was locked.
          </p>
        </div>

        {/* ─── Champion + Test Partition ─── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", marginBottom: "64px", borderTop: "1px solid var(--border-faint)", paddingTop: "40px" }}>
          {/* Champion block */}
          <div>
            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: "var(--text-faint)", textTransform: "uppercase", marginBottom: "16px" }}>
              Production Model · Selected on Val RMSE
            </p>
            <h2 style={{ fontSize: "clamp(28px,3.5vw,40px)", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.04em", lineHeight: 1.05, marginBottom: "6px" }}>
              Random Forest
            </h2>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "28px" }}>
              160 estimators · max depth 24 · min samples leaf 2 · sqrt feature subsampling
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", borderTop: "1px solid var(--border-faint)", paddingTop: "20px" }}>
              <div>
                <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-faint)", textTransform: "uppercase", marginBottom: "8px" }}>
                  Overall Val RMSE
                </p>
                <p className="tabular" style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-0.04em", color: "var(--text-primary)", lineHeight: 1 }}>
                  {Number(d.best?.overall_rmse ?? 22.86).toFixed(2)}
                </p>
              </div>
              <div>
                <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-faint)", textTransform: "uppercase", marginBottom: "8px" }}>
                  Mean Val R²
                </p>
                <p className="tabular" style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-0.04em", color: "var(--aqi-good)", lineHeight: 1 }}>
                  {Number(d.best?.r2 ?? 0.676).toFixed(3)}
                </p>
              </div>
            </div>

            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "20px", lineHeight: 1.6 }}>
              Fitted on 73,818 training rows (Aug 2022 – May 2025). Evaluated against Ridge and LSTM on 15,822 validation rows.
            </p>
          </div>

          {/* Test Partition */}
          <div>
            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: "var(--text-faint)", textTransform: "uppercase", marginBottom: "16px" }}>
              Generalization Proof · Untouched Test Partition
            </p>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>
              Performance across the unseen test period (Dec 31, 2025 – Aug 07, 2026):
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {testOverall.map((m: any) => (
                <div key={m.horizon} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border-faint)" }}>
                  <div>
                    <strong style={{ fontSize: "13px", color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                      +{m.horizon}h Forecast
                    </strong>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginTop: "2px" }}>
                      RMSE {Number(m.rmse).toFixed(2)} · MAE {Number(m.mae).toFixed(2)}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className="tabular" style={{ fontSize: "22px", fontWeight: 800, color: "var(--aqi-good)", letterSpacing: "-0.03em" }}>
                      {Number(m.r2).toFixed(3)}
                    </span>
                    <span style={{ display: "block", fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-faint)", textTransform: "uppercase" }}>
                      Test R²
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Candidate Benchmark Table ─── */}
        <div style={{ marginBottom: "64px" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: "var(--text-faint)", textTransform: "uppercase", marginBottom: "20px" }}>
            Candidate Comparison · Validation Benchmark Across All 5 Architectures
          </p>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-medium)" }}>
                  {["Model", "+24h RMSE", "+48h RMSE", "+72h RMSE", "Overall RMSE", "Mean R²", "Status"].map((h) => (
                    <th key={h} style={{ padding: "10px 16px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-faint)", textTransform: "uppercase", fontVariantNumeric: "tabular-nums" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.models.map((m: any) => {
                  const isWinner = m.model === "aqi_random_forest";
                  return (
                    <tr key={m.model} style={{ borderBottom: "1px solid var(--border-faint)", background: isWinner ? "rgba(16, 185, 129, 0.04)" : "transparent" }}>
                      <td style={{ padding: "14px 16px", fontWeight: isWinner ? 700 : 500, color: isWinner ? "var(--aqi-good)" : "var(--text-primary)", letterSpacing: "-0.01em" }}>
                        {MODEL_NAMES[m.model] || m.model}
                      </td>
                      <td className="tabular" style={{ padding: "14px 16px", color: "var(--text-secondary)" }}>{Number(m["24h_rmse"]).toFixed(2)}</td>
                      <td className="tabular" style={{ padding: "14px 16px", color: "var(--text-secondary)" }}>{Number(m["48h_rmse"]).toFixed(2)}</td>
                      <td className="tabular" style={{ padding: "14px 16px", color: "var(--text-secondary)" }}>{Number(m["72h_rmse"]).toFixed(2)}</td>
                      <td className="tabular" style={{ padding: "14px 16px", fontWeight: 700, color: "var(--text-primary)" }}>{Number(m.overall_rmse).toFixed(2)}</td>
                      <td className="tabular" style={{ padding: "14px 16px", fontWeight: 700, color: isWinner ? "var(--aqi-good)" : "var(--text-secondary)" }}>{Number(m.r2).toFixed(3)}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", color: isWinner ? "var(--aqi-good)" : "var(--text-faint)", textTransform: "uppercase" }}>
                          {isWinner ? "Production" : "Benchmark"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p style={{ fontSize: "12px", color: "var(--text-faint)", marginTop: "16px", lineHeight: 1.6 }}>
            <strong style={{ color: "var(--text-muted)" }}>Observation:</strong> While Ridge achieves slightly lower RMSE at +24h (17.99 vs 18.57), Random Forest demonstrated superior multi-horizon generalization at +48h and +72h, earning the overall champion selection.
          </p>
        </div>

        {/* ─── City-by-City Test Breakdown ─── */}
        <div style={{ marginBottom: "64px" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: "var(--text-faint)", textTransform: "uppercase", marginBottom: "20px" }}>
            Geographic Disaggregation · Random Forest Test Performance by City
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0", borderTop: "1px solid var(--border-faint)", borderLeft: "1px solid var(--border-faint)" }}>
            {[{ name: "Karachi", data: testKarachi }, { name: "Lahore", data: testLahore }, { name: "Islamabad", data: testIslamabad }].map((cityBlock) => (
              <div key={cityBlock.name} style={{ padding: "24px 24px", borderRight: "1px solid var(--border-faint)", borderBottom: "1px solid var(--border-faint)" }}>
                <strong style={{ fontSize: "14px", color: "var(--text-primary)", letterSpacing: "-0.01em", display: "block", marginBottom: "16px" }}>
                  {cityBlock.name}
                </strong>
                <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                  {cityBlock.data.map((m: any) => (
                    <div key={m.horizon} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", borderBottom: "1px solid var(--border-faint)", padding: "8px 0" }}>
                      <span style={{ color: "var(--text-muted)" }}>+{m.horizon}h</span>
                      <span className="tabular" style={{ color: "var(--text-secondary)" }}>
                        RMSE <strong style={{ color: "var(--text-primary)" }}>{Number(m.rmse).toFixed(1)}</strong>
                        <span style={{ color: "var(--text-faint)", margin: "0 4px" }}>·</span>
                        R² <strong style={{ color: "var(--aqi-good)" }}>{Number(m.r2).toFixed(3)}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Global SHAP ─── */}
        <div>
          <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: "var(--text-faint)", textTransform: "uppercase", marginBottom: "20px" }}>
            Top 14 Global SHAP Predictor Influences · +24h Horizon · TreeExplainer
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0", borderTop: "1px solid var(--border-faint)" }}>
            {d.features.slice(0, 14).map((f: any, idx: number) => (
              <div key={f.feature} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderBottom: "1px solid var(--border-faint)", gap: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-faint)", minWidth: "20px" }}>#{idx + 1}</span>
                  <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)" }}>{formatFeatureName(f.feature)}</span>
                </div>
                <span className="tabular" style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", flexShrink: 0 }}>
                  {Number(f.mean_abs_shap_24h).toFixed(3)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="site-footer" style={{ marginTop: "auto" }}>
        <span className="footer-brand">PEARLS AIR INTELLIGENCE</span>
        <span>Model Registry v1 · Validated on Python 3.11 &amp; scikit-learn</span>
      </footer>
    </main>
  );
}
