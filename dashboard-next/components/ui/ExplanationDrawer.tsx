"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { formatFeatureName } from "@/lib/aqi";

interface ExplanationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  city: string;
  topFeatures?: Array<{ feature: string; mean_abs_shap_24h?: number }>;
  currentAQI?: number | null;
  forecast24h?: number | null;
}

export default function ExplanationDrawer({
  isOpen,
  onClose,
  city,
  topFeatures = [],
  currentAQI,
  forecast24h,
}: ExplanationDrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="drawer-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            aria-label="Forecast Intelligence Details"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="drawer-header">
              <div>
                <h3 className="drawer-title">Forecast Intelligence</h3>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                  {city} · global model drivers
                </p>
              </div>
              <button
                onClick={onClose}
                style={{ padding: "6px", borderRadius: "var(--radius-sm)", color: "var(--text-secondary)" }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Observed → +24h */}
            <div style={{ borderTop: "1px solid var(--border-faint)", paddingTop: "20px" }}>
              <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-faint)", textTransform: "uppercase", marginBottom: "14px" }}>
                Active Horizon Context
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-faint)", textTransform: "uppercase" }}>Observed Now</span>
                  <p className="tabular" style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.04em", color: "var(--text-primary)", lineHeight: 1, marginTop: "4px" }}>
                    {currentAQI != null ? Math.round(currentAQI) : "—"}
                    <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-muted)", marginLeft: "6px" }}>AQI</span>
                  </p>
                </div>
                <span style={{ color: "var(--text-faint)", fontSize: "18px" }}>→</span>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-faint)", textTransform: "uppercase" }}>Predicted +24h</span>
                  <p className="tabular" style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.04em", color: "var(--text-primary)", lineHeight: 1, marginTop: "4px" }}>
                    {forecast24h != null ? Math.round(forecast24h) : "—"}
                    <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-muted)", marginLeft: "6px" }}>AQI</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Global SHAP drivers */}
            <div style={{ borderTop: "1px solid var(--border-faint)", paddingTop: "20px" }}>
              <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-faint)", textTransform: "uppercase", marginBottom: "8px" }}>
                Key Global Drivers · SHAP Importance
              </p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px", lineHeight: 1.6 }}>
                These atmospheric signals exhibit the highest mean absolute SHAP influence on the 24-hour prediction model:
              </p>

              <div className="shap-list">
                {topFeatures.slice(0, 7).map((f) => {
                  const val = f.mean_abs_shap_24h ?? 0;
                  const maxVal = topFeatures[0]?.mean_abs_shap_24h ?? 1;
                  const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
                  return (
                    <div key={f.feature} className="shap-row">
                      <span className="shap-label">{formatFeatureName(f.feature)}</span>
                      <div className="shap-bar-track">
                        <div className="shap-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                      {f.mean_abs_shap_24h != null && (
                        <span className="shap-val tabular">{val.toFixed(3)}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Scientific note */}
            <div style={{ borderTop: "1px solid var(--border-faint)", paddingTop: "16px" }}>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.6 }}>
                <strong style={{ color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Scientific Transparency Note
                </strong>
                Mean absolute SHAP magnitude measures influence intensity across the training distribution. It indicates which features most strongly govern model decisions — not directional causation for individual moments.
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
