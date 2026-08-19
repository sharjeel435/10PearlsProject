"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import AnimatedNumber from "@/components/motion/AnimatedNumber";
import TooltipGlossary from "@/components/ui/Tooltip";

const MODEL_LABELS: Record<string, string> = {
  aqi_random_forest:   "Random Forest",
  aqi_ridge:           "Ridge Regression",
  persistence:         "Current Persistence",
  seasonal_persistence:"Seasonal Persistence",
  aqi_lstm:            "TensorFlow LSTM",
};

interface ModelLabPanelProps {
  models: any[];
  bestModel: any;
  cityMetrics: any[];
}

export default function ModelLabPanel({ models, bestModel, cityMetrics }: ModelLabPanelProps) {
  const chartData = useMemo(() =>
    models.map((m: any) => ({
      rawKey: m.model,
      name: MODEL_LABELS[m.model] || m.model,
      rmse: Number(m.overall_rmse),
      r2:   Number(m.r2),
      isChampion: m.model === "aqi_random_forest",
    })),
    [models]
  );

  const testRfOverall = useMemo(
    () => cityMetrics.filter((m: any) => m.model === "aqi_random_forest" && m.city === "overall"),
    [cityMetrics]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

      {/* ─── Top: Validation chart + Production model ─── */}
      <div className="model-lab-layout">

        {/* Validation Benchmark Chart */}
        <div>
          <p className="panel-title">Validation Benchmark · Mean RMSE (lower is better)</p>
          <div style={{ height: "240px", width: "100%", marginTop: "8px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
              >
                <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  type="number"
                  stroke="transparent"
                  tick={{ fill: "var(--text-faint)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={148}
                  tick={{ fill: "var(--text-secondary)", fontSize: 12, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div style={{ background: "var(--bg-surface-2)", border: "1px solid var(--border-medium)", borderRadius: "var(--radius-md)", padding: "10px 14px", fontSize: "12px" }}>
                        <p style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>{d.name}</p>
                        <p style={{ color: "var(--text-secondary)" }}>Overall RMSE: <strong>{d.rmse.toFixed(2)}</strong></p>
                        <p style={{ color: "var(--text-muted)" }}>Val R²: <strong>{d.r2.toFixed(3)}</strong></p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="rmse" radius={[0, 3, 3, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.isChampion ? "var(--aqi-good)" : "rgba(255,255,255,0.08)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Production Model */}
        <div className="production-model-block">
          <p className="production-model-label">Production Model</p>
          <h3 className="production-model-name">Random Forest</h3>
          <p className="production-model-spec">160 estimators · max depth 24 · sqrt feature subsampling</p>

          <div className="model-metric-pair">
            <div className="model-metric-item">
              <span className="model-metric-label">Val Overall RMSE</span>
              <span className="model-metric-value tabular">
                <AnimatedNumber value={bestModel?.validation_metrics?.overall_rmse ?? 22.86} decimals={2} />
              </span>
            </div>
            <div className="model-metric-item">
              <span className="model-metric-label">Val Mean R²</span>
              <span className="model-metric-value tabular" style={{ color: "var(--aqi-good)" }}>
                <AnimatedNumber value={bestModel?.validation_metrics?.r2 ?? 0.676} decimals={3} />
              </span>
            </div>
          </div>

          <p className="model-selection-note">
            Selected solely on validation RMSE. The final chronological test partition remained completely untouched during model selection.
          </p>
        </div>
      </div>

      {/* ─── Generalization Audit ─── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <p className="panel-title" style={{ margin: 0 }}>Generalization Audit · Final Untouched Test Partition</p>
          <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "var(--aqi-good)", textTransform: "uppercase" }}>Verified</span>
        </div>

        <div className="horizon-metrics-grid">
          {testRfOverall.map((hMetric: any) => (
            <div key={hMetric.horizon} className="horizon-metric-card">
              <p className="horizon-label">+{hMetric.horizon} Hours</p>

              <div className="horizon-metric-row">
                <span>RMSE</span>
                <strong>{Number(hMetric.rmse).toFixed(2)}</strong>
              </div>
              <div className="horizon-metric-row">
                <span>MAE</span>
                <strong>{Number(hMetric.mae).toFixed(2)}</strong>
              </div>
              <div className="horizon-metric-row">
                <TooltipGlossary term="R2">
                  <span style={{ cursor: "help", borderBottom: "1px dashed var(--border-medium)" }}>R²</span>
                </TooltipGlossary>
                <strong style={{ color: "var(--aqi-good)" }}>{Number(hMetric.r2).toFixed(3)}</strong>
              </div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: "11px", color: "var(--text-faint)", marginTop: "20px", lineHeight: 1.55 }}>
          <strong style={{ color: "var(--text-muted)" }}>Scientific note:</strong> R² measures proportion of variance explained — not classification accuracy. Performance naturally degrades as forecast uncertainty increases from +24h to +72h.
        </p>
      </div>
    </div>
  );
}
