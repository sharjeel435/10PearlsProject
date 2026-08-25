"use client";

import { motion } from "motion/react";
import AnimatedNumber from "@/components/motion/AnimatedNumber";
import Tooltip from "@/components/ui/Tooltip";

interface KPIRailProps {
  totalRows?: number;
  featureCount?: number;
  testR2_24h?: number; // actual 24h test R² — 0.824
  modelName?: string;
  leakageGatesPassing?: number;
}

export default function KPIRail({
  totalRows = 105912,
  featureCount = 354,
  testR2_24h = 0.824,  // from best_model.json r2_24h
  modelName = "Random Forest",
  leakageGatesPassing = 6,
}: KPIRailProps) {
  const stats = [
    {
      number: totalRows.toLocaleString(),
      isAnimated: false,
      label: "Observations",
      sub: "4 years continuous · hourly",
      tooltip: "105,912 continuous hourly observations across Karachi, Lahore, and Islamabad from Aug 2022 to Aug 2026.",
    },
    {
      number: featureCount,
      isAnimated: false,
      label: "Predictors",
      sub: "Leakage-safe curated signals",
      tooltip: "354 features selected from 362 candidate columns after automated leakage prevention and duplicate elimination.",
    },
    {
      value: testR2_24h,
      isAnimated: true,
      decimals: 3,
      label: "24h Test R²",
      sub: "Untouched chronological partition",
      tooltip: "R² on the final unseen test set (Dec 2025 – Aug 2026). Measures proportion of variance explained — not classification accuracy. R²=1.0 is perfect; 0.824 is strong for a 24-hour atmospheric forecast.",
    },
    {
      number: modelName,
      isAnimated: false,
      label: "Production Model",
      sub: "Selected on validation RMSE",
      tooltip: "Random Forest (160 estimators, max depth 24) outperformed Ridge and LSTM on overall validation RMSE, despite Ridge achieving lower +24h RMSE individually.",
    },
    {
      number: `${leakageGatesPassing} / 6`,
      isAnimated: false,
      label: "Leakage Gates",
      sub: "All safety checks passing",
      tooltip: "6 automated leakage checks: cross-city isolation, targets, trailing rolling windows, train-only scaling, chronology, LSTM sequence safety.",
    },
  ];

  return (
    <div className="kpi-stat-strip">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          className="kpi-stat-item"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
        >
          <Tooltip term={stat.label} customText={stat.tooltip}>
            <p className="kpi-stat-label">{stat.label}</p>
          </Tooltip>
          <p className="kpi-stat-number tabular">
            {stat.isAnimated ? (
              <AnimatedNumber value={stat.value as number} decimals={stat.decimals} duration={0.4} />
            ) : (
              stat.number
            )}
          </p>
          <p className="kpi-stat-sub">{stat.sub}</p>
        </motion.div>
      ))}
    </div>
  );
}
