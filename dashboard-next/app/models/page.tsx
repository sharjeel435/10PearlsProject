import SiteHeader from "@/components/SiteHeader";
import { loadDashboardData } from "@/lib/data";

const MODEL_NAMES: Record<string, string> = {
  aqi_random_forest:    "Random Forest",
  aqi_ridge:            "Ridge Regression",
  persistence:          "Current Persistence",
  seasonal_persistence: "Seasonal Persistence",
  aqi_lstm:             "TensorFlow LSTM",
};

// Colors for each horizon bar
const HORIZON_COLORS = ["#d4a017", "#e8723a", "#e05252"];

function RmseBar({
  horizon,
  rmse,
  r2,
  color,
  maxRmse = 30,
}: {
  horizon: string;
  rmse: number;
  r2: number;
  color: string;
  maxRmse?: number;
}) {
  const pct = Math.min((rmse / maxRmse) * 100, 100).toFixed(1);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "64px 1fr 120px", gap: "16px", alignItems: "center", padding: "14px 0", borderBottom: "1px solid var(--border-faint)" }}>
      <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.02em" }}>
        {horizon}
      </span>
      <div style={{ background: "var(--bg-surface-2)", borderRadius: "4px", height: "10px", overflow: "hidden" }}>
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            borderRadius: "4px",
            transition: "width 0.6s ease",
          }}
        />
      </div>
      <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
        <span className="tabular" style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
          {rmse.toFixed(2)}
          <span style={{ fontSize: "10px", color: "var(--text-faint)", marginLeft: "3px" }}>RMSE</span>
        </span>
        <span className="tabular" style={{ fontSize: "13px", fontWeight: 700, color: color }}>
          {r2.toFixed(3)}
          <span style={{ fontSize: "10px", color: "var(--text-faint)", marginLeft: "3px" }}>R²</span>
        </span>
      </div>
    </div>
  );
}

export default async function ModelsPage() {
  const d = await loadDashboardData();

  const tm = d.best?.final_test_metrics ?? {};
  const test24hRmse = Number(tm["24h_rmse"] ?? 19.07);
  const test48hRmse = Number(tm["48h_rmse"] ?? 24.70);
  const test72hRmse = Number(tm["72h_rmse"] ?? 26.34);
  const test24hR2   = Number(tm.r2_24h ?? 0.824);
  const test48hR2   = Number(tm.r2_48h ?? 0.704);
  const test72hR2   = Number(tm.r2_72h ?? 0.662);
  const testOverallRmse = Number(tm.overall_rmse ?? 23.37);
  const testOverallR2   = Number(tm.r2 ?? 0.730);

  const testKarachi   = d.cityMetrics.filter((x: any) => x.model === "aqi_random_forest" && x.city === "Karachi");
  const testLahore    = d.cityMetrics.filter((x: any) => x.model === "aqi_random_forest" && x.city === "Lahore");
  const testIslamabad = d.cityMetrics.filter((x: any) => x.model === "aqi_random_forest" && x.city === "Islamabad");

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <SiteHeader />

      <div style={{ maxWidth: "1500px", margin: "0 auto", padding: "72px 4vw 96px", width: "100%" }}>

        {/* ─── Hero ─── */}
        <div style={{ marginBottom: "56px" }}>
          <p className="section-label">Model observability &amp; benchmarks</p>
          <h1 className="section-heading" style={{ marginBottom: "12px" }}>
            Model Performance &amp; Evaluation
          </h1>
          <p className="section-description">
            Random Forest was selected exclusively using validation RMSE. The chronological test split remained untouched until selection was locked — a true held-out generalization proof.
          </p>
        </div>

        {/* ─── Per-Horizon RMSE Visual Bars ─── */}
        <div style={{ marginBottom: "56px", padding: "32px", background: "var(--bg-surface-1)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)" }}>
          <div style={{ marginBottom: "24px" }}>
            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: "var(--text-faint)", textTransform: "uppercase", marginBottom: "6px" }}>
              Test-Partition RMSE by Forecast Horizon
            </p>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Performance degrades naturally with horizon — expected for atmospheric prediction. All three horizons represent untouched test data never seen during training or selection.
            </p>
          </div>

          <RmseBar horizon="+24h" rmse={test24hRmse} r2={test24hR2} color={HORIZON_COLORS[0]} />
          <RmseBar horizon="+48h" rmse={test48hRmse} r2={test48hR2} color={HORIZON_COLORS[1]} />
          <RmseBar horizon="+72h" rmse={test72hRmse} r2={test72hR2} color={HORIZON_COLORS[2]} />

          <p style={{ fontSize: "10px", color: "var(--text-faint)", marginTop: "12px" }}>
            Bars scaled to 30 RMSE units. R² = coefficient of determination, not classification accuracy.
          </p>
        </div>

        {/* ─── Ridge Honest Note ─── */}
        <div style={{ marginBottom: "56px", padding: "24px 28px", background: "rgba(212, 160, 23, 0.04)", border: "1px solid rgba(212, 160, 23, 0.2)", borderRadius: "var(--radius-lg)" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: "#d4a017", textTransform: "uppercase", marginBottom: "10px" }}>
            ⚡ Notable: Ridge Beats RF at +24h
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
            <div>
              <div style={{ display: "flex", gap: "24px", marginBottom: "12px" }}>
                <div>
                  <span className="tabular" style={{ fontSize: "22px", fontWeight: 800, color: "#d4a017", letterSpacing: "-0.03em" }}>17.96</span>
                  <span style={{ fontSize: "10px", color: "var(--text-faint)", display: "block", marginTop: "2px" }}>Ridge +24h RMSE</span>
                </div>
                <div style={{ alignSelf: "center", color: "var(--text-faint)", fontSize: "20px" }}>vs</div>
                <div>
                  <span className="tabular" style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>18.50</span>
                  <span style={{ fontSize: "10px", color: "var(--text-faint)", display: "block", marginTop: "2px" }}>RF +24h RMSE</span>
                </div>
              </div>
            </div>
            <div>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.65 }}>
                Ridge achieves lower error at the shortest horizon. Random Forest was selected because it dominates at +48h and +72h, giving the best <strong style={{ color: "var(--text-primary)" }}>overall</strong> multi-horizon forecast. Selecting on a single horizon would have been misleading.
              </p>
            </div>
          </div>
        </div>

        {/* ─── Champion + Test Partition Overview ─── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", marginBottom: "64px", borderTop: "1px solid var(--border-faint)", paddingTop: "40px" }}>
          {/* Champion block */}
          <div>
            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: "var(--text-faint)", textTransform: "uppercase", marginBottom: "16px" }}>
              Production Model · Selected on Val Overall RMSE
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
                  Test Overall RMSE
                </p>
                <p className="tabular" style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-0.04em", color: "var(--text-primary)", lineHeight: 1 }}>
                  {testOverallRmse.toFixed(2)}
                </p>
              </div>
              <div>
                <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-faint)", textTransform: "uppercase", marginBottom: "8px" }}>
                  Test Overall R²
                </p>
                <p className="tabular" style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-0.04em", color: "var(--aqi-good)", lineHeight: 1 }}>
                  {testOverallR2.toFixed(3)}
                </p>
              </div>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-faint)", marginTop: "12px", lineHeight: 1.6 }}>
              Evaluated on 15,822 unseen test rows (Dec 31, 2025–Aug 2026). These figures were computed after model selection was finalized.
            </p>
          </div>

          {/* Per-horizon R² summary */}
          <div>
            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: "var(--text-faint)", textTransform: "uppercase", marginBottom: "16px" }}>
              Per-Horizon R² · Untouched Test Partition
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {[
                { h: "24h", rmse: test24hRmse, r2: test24hR2, color: HORIZON_COLORS[0] },
                { h: "48h", rmse: test48hRmse, r2: test48hR2, color: HORIZON_COLORS[1] },
                { h: "72h", rmse: test72hRmse, r2: test72hR2, color: HORIZON_COLORS[2] },
              ].map((row) => (
                <div key={row.h} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid var(--border-faint)" }}>
                  <div>
                    <strong style={{ fontSize: "13px", color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                      +{row.h} Forecast
                    </strong>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginTop: "2px" }}>
                      RMSE {row.rmse.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className="tabular" style={{ fontSize: "22px", fontWeight: 800, color: row.color, letterSpacing: "-0.03em" }}>
                      {row.r2.toFixed(3)}
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

          <div style={{ overflowX: "auto", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-medium)", background: "var(--bg-surface-2)" }}>
                  {["Model", "+24h RMSE", "+48h RMSE", "+72h RMSE", "Overall RMSE", "Mean R²", "Status"].map((h) => (
                    <th key={h} style={{ padding: "12px 16px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-faint)", textTransform: "uppercase" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.models.map((m: any) => {
                  const isWinner = m.model === "aqi_random_forest";
                  const isRidge  = m.model === "aqi_ridge";
                  return (
                    <tr key={m.model} style={{ borderBottom: "1px solid var(--border-faint)", background: isWinner ? "rgba(16, 185, 129, 0.04)" : "transparent" }}>
                      <td style={{ padding: "14px 16px", fontWeight: isWinner ? 700 : 500, color: isWinner ? "var(--aqi-good)" : "var(--text-primary)", letterSpacing: "-0.01em" }}>
                        {MODEL_NAMES[m.model] || m.model}
                        {isWinner && <span style={{ marginLeft: "8px", fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", background: "rgba(16,185,129,0.12)", color: "var(--aqi-good)", padding: "2px 6px", borderRadius: "4px" }}>PRODUCTION</span>}
                      </td>
                      <td className="tabular" style={{ padding: "14px 16px", color: isRidge ? "#d4a017" : "var(--text-secondary)", fontWeight: isRidge ? 700 : 400 }}>
                        {Number(m["24h_rmse"]).toFixed(2)}
                        {isRidge && <span style={{ marginLeft: "6px", fontSize: "9px", color: "#d4a017" }}>★ lowest</span>}
                      </td>
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

          <p style={{ fontSize: "11px", color: "var(--text-faint)", marginTop: "12px", lineHeight: 1.6 }}>
            ★ Ridge achieves the lowest +24h RMSE — see the callout above. Selection was made on <em>overall</em> RMSE across all three horizons.
          </p>
        </div>

        {/* ─── City-by-City Test Breakdown ─── */}
        <div style={{ marginBottom: "64px" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: "var(--text-faint)", textTransform: "uppercase", marginBottom: "20px" }}>
            Geographic Disaggregation · Random Forest Test Performance by City
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0", borderTop: "1px solid var(--border-faint)", borderLeft: "1px solid var(--border-faint)" }}>
            {[
              { name: "Karachi",   data: testKarachi },
              { name: "Lahore",    data: testLahore },
              { name: "Islamabad", data: testIslamabad },
            ].map((cityBlock) => (
              <div key={cityBlock.name} style={{ padding: "24px", borderRight: "1px solid var(--border-faint)", borderBottom: "1px solid var(--border-faint)" }}>
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
            {d.features.slice(0, 14).map((f: any, idx: number) => {
              const maxShap = Number(d.features[0]?.mean_abs_shap_24h ?? 1);
              const pct = Math.min((Number(f.mean_abs_shap_24h) / maxShap) * 100, 100);
              return (
                <div key={f.feature} style={{ padding: "12px 0", borderBottom: "1px solid var(--border-faint)", paddingRight: "24px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-faint)", minWidth: "22px" }}>#{idx + 1}</span>
                      <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)" }}>{f.feature}</span>
                    </div>
                    <span className="tabular" style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", flexShrink: 0 }}>
                      {Number(f.mean_abs_shap_24h).toFixed(3)}
                    </span>
                  </div>
                  <div style={{ marginLeft: "32px", height: "3px", background: "var(--bg-surface-2)", borderRadius: "2px" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: "var(--aqi-good)", borderRadius: "2px", opacity: 0.6 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <footer className="site-footer" style={{ marginTop: "auto" }}>
        <span className="footer-brand">PEARLS AIR INTELLIGENCE</span>
        <span>Model Registry v1 · scikit-learn 1.5 · Python 3.12</span>
      </footer>
    </main>
  );
}
