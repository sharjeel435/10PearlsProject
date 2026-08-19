"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { formatFeatureName } from "@/lib/aqi";

const FEATURE_FAMILIES = [
  { name: "Rolling Windows",   count: 168, desc: "Trailing statistical aggregations (mean, min, max, std) across 3h–168h windows. Fitted strictly on backward-looking data." },
  { name: "Lag Signals",       count: 85,  desc: "Autoregressive memory checkpoints at specific past time steps (t-1h through t-168h)." },
  { name: "Change Features",   count: 34,  desc: "First-order temporal derivatives and percentage changes capturing rapid atmospheric acceleration or stabilization." },
  { name: "Calendar & Cycles", count: 18,  desc: "Harmonic cyclical transformations (sin/cos) of hour-of-day, day-of-week, day-of-year representing solar and seasonal rhythms." },
  { name: "Interactions",      count: 16,  desc: "Cross-domain products and ratios between thermodynamic and pollution states." },
  { name: "Episodes",          count: 9,   desc: "Non-linear binary threshold flags marking persistent hazardous stagnation events." },
  { name: "Wind-Derived",      count: 9,   desc: "Aerodynamic dispersion indicators combining wind speed squared, gust vectors, and calm air flags." },
  { name: "Raw Signals",       count: 14,  desc: "Base atmospheric and pollutant telemetry observed at current sensor timestep." },
  { name: "City Encoding",     count: 1,   desc: "Geographic categorical encoding maintaining topographical and microclimate offsets." },
];

interface FeatureIntelligencePanelProps {
  features: Array<{ feature: string; mean_abs_shap_24h: number }>;
}

export default function FeatureIntelligencePanel({ features }: FeatureIntelligencePanelProps) {
  const [selectedFamily, setSelectedFamily] = useState<number>(0);
  const [showAll, setShowAll] = useState<boolean>(false);

  const displayedFeatures = showAll ? features : features.slice(0, 12);
  const maxShap = features.length > 0 ? Number(features[0].mean_abs_shap_24h) : 3.5;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>

      {/* ─── Feature Family Grid ─── */}
      <div>
        <p className="panel-title">354 Engineered Signals · 9 Mathematical Families</p>
        <div className="feature-arch-grid">
          {FEATURE_FAMILIES.map((fam, i) => (
            <button
              key={fam.name}
              className={`feature-family-btn${selectedFamily === i ? " selected" : ""}`}
              onClick={() => setSelectedFamily(i)}
            >
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <span className="feature-family-name">{fam.name}</span>
                <span className="feature-family-count tabular">{fam.count}</span>
              </div>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedFamily}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              marginTop: "16px",
              padding: "16px 20px",
              background: "var(--bg-surface-2)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {FEATURE_FAMILIES[selectedFamily].desc}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ─── SHAP Feature Importance ─── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
          <p className="panel-title" style={{ margin: 0 }}>Global Feature Importance · SHAP TreeExplainer · +24h Horizon</p>
        </div>

        <p style={{ fontSize: "11px", color: "var(--text-faint)", marginBottom: "16px", lineHeight: 1.5 }}>
          Global SHAP values represent average marginal contribution across the validation dataset. They do not indicate which features caused any individual prediction.
        </p>

        <div className="shap-list">
          {displayedFeatures.map((f, i) => {
            const val = Number(f.mean_abs_shap_24h);
            const pct = maxShap > 0 ? (val / maxShap) * 100 : 0;
            return (
              <motion.div
                key={f.feature}
                className="shap-row"
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: i * 0.02 }}
              >
                <span className="shap-label">{formatFeatureName(f.feature)}</span>
                <div className="shap-bar-track">
                  <div className="shap-bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="shap-val tabular">{val.toFixed(3)}</span>
              </motion.div>
            );
          })}
        </div>

        {features.length > 12 && (
          <button
            onClick={() => setShowAll(!showAll)}
            style={{
              marginTop: "16px",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              borderBottom: "1px solid var(--border-subtle)",
              paddingBottom: "1px",
              transition: "color 0.15s ease",
            }}
          >
            {showAll ? "Show fewer features" : `Show all ${features.length} features`} →
          </button>
        )}
      </div>
    </div>
  );
}
