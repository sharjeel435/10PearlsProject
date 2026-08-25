"use client";

import AnimatedNumber from "@/components/motion/AnimatedNumber";

interface DataFoundationPanelProps {
  qualityReport: any;
}

export default function DataFoundationPanel({ qualityReport }: DataFoundationPanelProps) {
  const byCity = qualityReport?.by_city || {
    Karachi:   { clean_rows: 35304, missing_timestamps: 0, missing_values: 528 },
    Lahore:    { clean_rows: 35304, missing_timestamps: 0, missing_values: 534 },
    Islamabad: { clean_rows: 35304, missing_timestamps: 0, missing_values: 528 },
  };

  // Timestamp coverage is 100% (0 missing timestamps per city — separate from cell-level missing values)
  const timestampCoverage = 100;

  // Cell completeness: (1 - missing_percentage) × 100
  const cellCompleteness = qualityReport?.missing_percentage != null
    ? (100 - qualityReport.missing_percentage).toFixed(2)
    : "99.86";

  const totalMissingValues = qualityReport?.cleaning?.missing_values ?? 1590;
  const startDate = qualityReport?.start_date ? new Date(qualityReport.start_date) : new Date("2022-08-01");
  const endDate = qualityReport?.end_date ? new Date(qualityReport.end_date) : new Date("2026-08-10");

  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  const totalMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());

  // Year labels for the coverage timeline
  const years = [];
  for (let y = startYear; y <= endYear; y++) years.push(y);

  return (
    <div className="data-foundation-layout">

      {/* ─── Left: Large number + timeline ─── */}
      <div>
        <p className="panel-title">Data Foundation</p>

        <div style={{ marginBottom: "24px" }}>
          <p style={{ fontSize: "clamp(56px,7vw,80px)", fontWeight: 800, letterSpacing: "-0.05em", color: "var(--text-primary)", lineHeight: 1, marginBottom: "4px" }}>
            <AnimatedNumber value={105912} duration={0.6} />
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            Verified hourly observations
          </p>
        </div>

        {/* Data Coverage Timeline */}
        <div style={{ marginBottom: "24px" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-faint)", textTransform: "uppercase", marginBottom: "12px" }}>
            Coverage Timeline
          </p>

          {/* Year axis */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            {years.map((y) => (
              <span key={y} style={{ fontSize: "9px", color: "var(--text-faint)", fontWeight: 600 }}>{y}</span>
            ))}
          </div>

          {/* Per-city coverage bars */}
          {Object.entries(byCity).map(([cityName]) => (
            <div key={cityName} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <span style={{ fontSize: "10px", color: "var(--text-muted)", width: "72px", flexShrink: 0 }}>{cityName}</span>
              <div style={{ flex: 1, height: "8px", background: "var(--bg-surface-3)", borderRadius: "4px", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: "100%",
                    background: "linear-gradient(90deg, var(--aqi-good) 0%, var(--aqi-moderate) 100%)",
                    borderRadius: "4px",
                  }}
                />
              </div>
              <span className="tabular" style={{ fontSize: "9px", color: "var(--text-faint)", flexShrink: 0 }}>
                35,304 hrs
              </span>
            </div>
          ))}

          <p style={{ fontSize: "10px", color: "var(--text-faint)", marginTop: "6px" }}>
            {Math.round(totalMonths)} months · Aug {startYear} → Aug {endYear}
          </p>
        </div>

        {/* Split info */}
        <p style={{ fontSize: "11px", color: "var(--text-faint)", lineHeight: 1.55 }}>
          Training (70%) · Validation (15%) · Test (15%) — chronologically ordered
        </p>

        {/* City breakdown */}
        <div style={{ marginTop: "16px" }}>
          {Object.entries(byCity).map(([cityName, cityData]: any) => (
            <div key={cityName} className="data-city-row">
              <span className="data-city-name">{cityName}</span>
              <span className="data-city-count tabular">{Number(cityData.clean_rows).toLocaleString()} rows</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Right: Quality stats ─── */}
      <div>
        <p className="panel-title">Quality Report</p>

        {/* Timestamp Coverage — 100% */}
        <div style={{ marginBottom: "20px", padding: "16px", background: "var(--aqi-good-bg)", border: "1px solid var(--aqi-good-border)", borderRadius: "var(--radius-md)" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "var(--aqi-good)", textTransform: "uppercase", marginBottom: "6px" }}>
            Timestamp Coverage
          </p>
          <p style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.04em", color: "var(--aqi-good)", lineHeight: 1 }}>
            {timestampCoverage}%
          </p>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
            0 missing hourly timestamps — complete continuous series
          </p>
        </div>

        {/* Cell Completeness — 99.86% */}
        <div style={{ marginBottom: "20px", padding: "16px", background: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-faint)", textTransform: "uppercase", marginBottom: "6px" }}>
            Cell Completeness
          </p>
          <p style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.04em", color: "var(--text-primary)", lineHeight: 1 }}>
            {cellCompleteness}%
          </p>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
            {totalMissingValues.toLocaleString()} missing cell values after cleaning — handled by backward-looking forward-fill
          </p>
        </div>

        {[
          { key: "Duplicate timestamps", val: qualityReport?.pre_validation?.duplicate_keys ?? 0 },
          { key: "Temporal resolution",  val: "1 hour" },
          { key: "Time zone",            val: "UTC (stored) · PKT (displayed)" },
          { key: "Source",               val: "Open-Meteo API" },
          { key: "Physical bounds",      val: "Verified" },
          { key: "Feature count",        val: `${qualityReport?.feature_count ?? 358} (raw) → 354 (model)` },
        ].map((row) => (
          <div key={row.key} className="data-quality-stat">
            <span className="data-quality-key">{row.key}</span>
            <span className="data-quality-val tabular">{String(row.val)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
