"use client";

import { motion } from "motion/react";
import AnimatedNumber from "@/components/motion/AnimatedNumber";
import Tooltip from "@/components/ui/Tooltip";

interface KPIRailProps {
  totalRows?: number;
  featureCount?: number;
  testR2?: number;
  modelName?: string;
  leakageGatesPassing?: number;
}

export default function KPIRail({
  totalRows = 105912,
  featureCount = 354,
  testR2 = 0.827,
  modelName = "Random Forest",
  leakageGatesPassing = 6,
}: KPIRailProps) {
  const stats = [
    {
      number: totalRows.toLocaleString(),
      isAnimated: false,
      label: "Observations",
      sub: "4 years continuous · UTC",
      tooltip: "105,912 continuous hourly observations across Karachi, Lahore, and Islamabad from 2022 to 2026.",
    },
    {
      number: featureCount,
      isAnimated: false,
      label: "Predictors",
      sub: "Leakage-safe curated signals",
      tooltip: "354 features selected from 362 candidate columns after automated leakage prevention and duplicate elimination.",
    },
    {
      value: testR2,
      isAnimated: true,
      decimals: 3,
      label: "24h Test R²",
      sub: "Untouched chronological partition",
      tooltip: "R² (Coefficient of Determination) measures proportion of variance explained. It is not percentage accuracy.",
    },
    {
      number: modelName,
      isAnimated: false,
      label: "Production Model",
      sub: "Selected on validation RMSE",
      tooltip: "Random Forest (160 estimators, max depth 24) outperformed Ridge and LSTM on the validation set.",
    },
    {
      number: `${leakageGatesPassing} / 6`,
      isAnimated: false,
      label: "Leakage Gates",
      sub: "All safety checks passing",
      tooltip: "6 automated checks: cross-city isolation, targets, trailing rolling windows, train-only scaling, chronology, LSTM safety.",
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
