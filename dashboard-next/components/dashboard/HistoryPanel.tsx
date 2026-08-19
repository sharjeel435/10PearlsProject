"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { getAQICategory, getCategoryHex } from "@/lib/aqi";

interface HistoryRecord {
  city: string;
  date: string;
  us_aqi: number;
  pm2_5: number;
  [key: string]: any;
}

interface HistoryPanelProps {
  city: string;
  historicalData: HistoryRecord[];
}

function HistoryTooltip({ active, payload, city }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const hex = getCategoryHex(d.category);
  return (
    <div
      style={{
        background: "var(--bg-surface-2)",
        border: "1px solid var(--border-medium)",
        borderRadius: "var(--radius-md)",
        padding: "12px 16px",
        fontSize: "12px",
        minWidth: "160px",
      }}
    >
      <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-faint)", textTransform: "uppercase", marginBottom: "8px" }}>
        {city} · {d.dateLabel}
      </p>
      <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "4px" }}>
        <span style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.03em", color: hex }}>{Math.round(d.us_aqi)}</span>
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Daily mean AQI</span>
      </div>
      <p style={{ fontSize: "11px", fontWeight: 700, color: hex, marginBottom: "6px" }}>{d.category}</p>
      <p style={{ fontSize: "10px", color: "var(--text-muted)", borderTop: "1px solid var(--border-faint)", paddingTop: "6px" }}>
        PM2.5: {Number(d.pm2_5).toFixed(1)} µg/m³
      </p>
    </div>
  );
}

export default function HistoryPanel({ city, historicalData }: HistoryPanelProps) {
  const [rangeDays, setRangeDays] = useState<number>(30);

  const filteredHistory = useMemo(() => {
    const cityRows = historicalData.filter((r) => r.city === city);
    const sorted = [...cityRows].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return sorted.slice(-rangeDays).map((item) => ({
      ...item,
      dateLabel: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
      category: getAQICategory(item.us_aqi),
    }));
  }, [city, historicalData, rangeDays]);

  return (
    <div>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <p className="panel-title" style={{ margin: 0 }}>Verified Daily Averages</p>
        <div className="history-range-selector">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setRangeDays(d)}
              className={`history-range-btn${rangeDays === d ? " active" : ""}`}
            >
              {d}D
            </button>
          ))}
        </div>
      </div>

      <div className="history-chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={filteredHistory} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="aqiGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="var(--aqi-moderate)" stopOpacity={0.12} />
                <stop offset="100%" stopColor="var(--aqi-moderate)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="dateLabel"
              stroke="transparent"
              tick={{ fill: "var(--text-faint)", fontSize: 10, fontWeight: 500 }}
              tickLine={false}
              interval={rangeDays === 30 ? 4 : rangeDays === 14 ? 2 : 0}
              axisLine={false}
            />
            <YAxis
              stroke="transparent"
              tick={{ fill: "var(--text-faint)", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={28}
            />
            <ReferenceLine y={100} stroke="rgba(212,160,23,0.2)"  strokeWidth={1} />
            <ReferenceLine y={150} stroke="rgba(232,114,58,0.2)"  strokeWidth={1} />

            <Tooltip content={<HistoryTooltip city={city} />} cursor={{ stroke: "rgba(255,255,255,0.06)", strokeWidth: 1 }} />

            <Area
              type="monotone"
              dataKey="us_aqi"
              stroke="var(--text-secondary)"
              strokeWidth={1.5}
              fill="url(#aqiGrad)"
              dot={false}
              activeDot={{ r: 4, fill: "var(--text-primary)", stroke: "var(--bg)", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="pm2_5"
              stroke="var(--text-faint)"
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              activeDot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "14px" }}>
        <div style={{ display: "flex", gap: "20px", fontSize: "10px", color: "var(--text-faint)" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: 12, height: 1.5, background: "var(--text-secondary)", display: "inline-block" }} />
            US AQI Daily Mean
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: 12, height: 1, background: "var(--text-faint)", display: "inline-block", borderTop: "1px dashed var(--text-faint)" }} />
            PM2.5 µg/m³
          </span>
        </div>
        <p style={{ fontSize: "10px", color: "var(--text-faint)" }}>
          Aggregated daily means · raw hourly data stays server-side
        </p>
      </div>
    </div>
  );
}
