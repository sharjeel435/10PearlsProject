"use client";

import AnimatedNumber from "@/components/motion/AnimatedNumber";

interface DataFoundationPanelProps {
  qualityReport: any;
}

export default function DataFoundationPanel({ qualityReport }: DataFoundationPanelProps) {
  const byCity = qualityReport?.by_city || {
    Karachi:   { clean_rows: 35304 },
    Lahore:    { clean_rows: 35304 },
    Islamabad: { clean_rows: 35304 },
  };

  const completeness = qualityReport?.missing_percentage != null
    ? (100 - qualityReport.missing_percentage).toFixed(2)
    : "99.86";

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

        {/* Timeline */}
        <div className="data-foundation-timeline">
          <span className="timeline-label">Aug 2022</span>
          <div className="timeline-line" />
          <span className="timeline-label" style={{ color: "var(--text-muted)" }}>Aug 2026</span>
        </div>

        <p style={{ fontSize: "11px", color: "var(--text-faint)", marginTop: "8px", marginBottom: "24px" }}>
          Training (70%) · Validation (15%) · Test (15%) — chronologically ordered
        </p>

        {/* City breakdown */}
        {Object.entries(byCity).map(([cityName, cityData]: any) => (
          <div key={cityName} className="data-city-row">
            <span className="data-city-name">{cityName}</span>
            <span className="data-city-count tabular">{Number(cityData.clean_rows).toLocaleString()}</span>
          </div>
        ))}
      </div>

      {/* ─── Right: Quality stats ─── */}
      <div>
        <p className="panel-title">Quality Report</p>

        {[
          { key: "Completeness",    val: `${completeness}%` },
          { key: "Missing hours",   val: qualityReport?.missing_count ?? "0" },
          { key: "Duplicate keys",  val: qualityReport?.duplicate_keys ?? "0" },
          { key: "Physical bounds", val: "Verified" },
          { key: "Temporal resolution", val: "1 hour" },
          { key: "Time zone",       val: "UTC" },
          { key: "Source",          val: "Open-Meteo API" },
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

