"use client";

import React, { useState } from "react";
import { Info } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export const GLOSSARY: Record<string, string> = {
  "AQI": "Air Quality Index (EPA Standard) is a normalized scale from 0 to 500 assessing health risk based on ambient pollutant levels.",
  "PM2.5": "Fine particulate matter with diameter ≤ 2.5 µm. Inhaled deep into lungs; primary driver of severe air pollution in Pakistan.",
  "PM10": "Inhalable coarse particulate matter with diameter ≤ 10 µm (dust, pollen, smoke particles).",
  "NO2": "Nitrogen Dioxide: Gas primarily emitted from vehicular combustion and industrial thermal power generation.",
  "SO2": "Sulphur Dioxide: Gas produced by combustion of sulphur-containing fossil fuels and heavy industry.",
  "CO": "Carbon Monoxide: Odourless, toxic gas produced by incomplete combustion in engines and generators.",
  "O3": "Surface Ozone: Secondary pollutant formed by chemical reactions between sunlight, NOx, and volatile organic compounds.",
  "RMSE": "Root Mean Squared Error: Measures model prediction deviation in AQI units. Lower values indicate better fit.",
  "MAE": "Mean Absolute Error: Average magnitude of prediction errors in AQI units. Less sensitive to outliers than RMSE.",
  "R2": "R² (Coefficient of Determination): Proportion of variance explained by model (goodness-of-fit). Not percentage accuracy.",
  "SHAP": "SHapley Additive exPlanations: Game-theoretic metric measuring each feature's contribution magnitude to model predictions.",
  "UTC": "Coordinated Universal Time: Primary standard for time synchronization across meteorological sensors without local DST shifts.",
  "Hopsworks": "Managed open-source feature store powering feature pipelines, reproducible datasets, and model artifacts.",
  "Leakage": "Data leakage occurs when test/future data inadvertently influences model training. Our pipeline passes 6/6 leakage checks."
};

interface TooltipProps {
  term: string;
  customText?: string;
  children?: React.ReactNode;
}

export default function Tooltip({ term, customText, children }: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const explanation = customText || GLOSSARY[term] || `Definition for ${term}`;

  return (
    <span
      className="tooltip-wrapper"
      style={{ position: "relative", display: "inline-flex", alignItems: "center", cursor: "help" }}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
      tabIndex={0}
      role="button"
      aria-label={`Explanation for ${term}`}
    >
      {children ? children : (
        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", borderBottom: "1px dashed var(--text-muted)" }}>
          {term}
          <Info size={12} style={{ color: "var(--text-muted)" }} />
        </span>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute",
              bottom: "calc(100% + 8px)",
              left: "50%",
              transform: "translateX(-50%)",
              background: "#0c171a",
              color: "var(--text-primary)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "8px",
              padding: "10px 14px",
              fontSize: "12px",
              lineHeight: 1.5,
              width: "max-content",
              maxWidth: "280px",
              zIndex: 1000,
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.6)",
              pointerEvents: "none",
            }}
          >
            <div style={{ fontWeight: 700, color: "var(--text-secondary)", marginBottom: "3px", fontSize: "11px" }}>
              {term}
            </div>
            <div style={{ color: "var(--text-secondary)" }}>
              {explanation}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
