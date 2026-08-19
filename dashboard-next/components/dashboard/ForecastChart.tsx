"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { getAQICategory, getCategoryHex } from "@/lib/aqi";

interface ForecastChartProps {
  city: string;
  observationAQI: number | null;
  observationTime?: string | null;
  forecast24h: number | null;
  forecast48h: number | null;
  forecast72h: number | null;
  time24h?: string;
  time48h?: string;
  time72h?: string;
}

function ChartTooltip({ active, payload, city }: any) {
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
        {city} · {d.displayLabel}
      </p>
      <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "4px" }}>
        <span style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.03em", color: hex }}>{d.aqi}</span>
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>US AQI</span>
      </div>
      <p style={{ fontSize: "11px", fontWeight: 700, color: hex, marginBottom: "6px" }}>{d.category}</p>
      <p style={{ fontSize: "10px", color: "var(--text-muted)", borderTop: "1px solid var(--border-faint)", paddingTop: "6px" }}>
        {d.timestamp}
      </p>
    </div>
  );
}

export default function ForecastChart({
  city,
  observationAQI,
  observationTime,
  forecast24h,
  forecast48h,
  forecast72h,
  time24h,
  time48h,
  time72h,
}: ForecastChartProps) {
  const chartData = useMemo(() => {
    const points = [];
    const fmt = (ts?: string | null) =>
      ts
        ? new Date(ts).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", timeZone: "UTC" }) + " UTC"
        : "";

    if (observationAQI != null && Number.isFinite(observationAQI)) {
      points.push({ horizon: "Now", displayLabel: "Observed", aqi: Math.round(observationAQI), category: getAQICategory(observationAQI), timestamp: fmt(observationTime) || "Observed", isObservation: true });
    }
    if (forecast24h != null) {
      points.push({ horizon: "+24h", displayLabel: "+24h Forecast", aqi: Math.round(forecast24h), category: getAQICategory(forecast24h), timestamp: fmt(time24h) || "+24 hours ahead", isObservation: false });
    }
    if (forecast48h != null) {
      points.push({ horizon: "+48h", displayLabel: "+48h Forecast", aqi: Math.round(forecast48h), category: getAQICategory(forecast48h), timestamp: fmt(time48h) || "+48 hours ahead", isObservation: false });
    }
    if (forecast72h != null) {
      points.push({ horizon: "+72h", displayLabel: "+72h Forecast", aqi: Math.round(forecast72h), category: getAQICategory(forecast72h), timestamp: fmt(time72h) || "+72 hours ahead", isObservation: false });
    }
    return points;
  }, [observationAQI, observationTime, forecast24h, forecast48h, forecast72h, time24h, time48h, time72h]);

  // Line color = category of most severe forecast point
  const forecastPoints = chartData.filter((d) => !d.isObservation);
  const lineColor = forecastPoints.length
    ? getCategoryHex(forecastPoints[forecastPoints.length - 1].category)
    : "var(--text-muted)";

  return (
    <div className="forecast-chart-wrapper">
      <div className="forecast-chart-header">
        <p className="forecast-chart-title">Discrete Forecast Trajectory · Now → +72h</p>
        <p style={{ fontSize: "10px", color: "var(--text-faint)" }}>4 discrete points</p>
      </div>

      <div className="forecast-chart-area">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 16, right: 16, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="horizon"
              stroke="transparent"
              tick={{ fill: "var(--text-muted)", fontSize: 11, fontWeight: 600, letterSpacing: "0.04em" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="transparent"
              tick={{ fill: "var(--text-faint)", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              domain={[0, "dataMax + 20"]}
              width={32}
            />
            <ReferenceLine y={50}  stroke="rgba(16,185,129,0.15)"  strokeWidth={1} />
            <ReferenceLine y={100} stroke="rgba(212,160,23,0.15)"  strokeWidth={1} />
            <ReferenceLine y={150} stroke="rgba(232,114,58,0.15)"  strokeWidth={1} />

            <Tooltip content={<ChartTooltip city={city} />} cursor={{ stroke: "rgba(255,255,255,0.06)", strokeWidth: 1 }} />

            <Line
              type="linear"
              dataKey="aqi"
              stroke={lineColor}
              strokeWidth={1.5}
              strokeDasharray="5 4"
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                const hex = getCategoryHex(payload.category);
                return payload.isObservation ? (
                  <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={5} fill={hex} stroke="var(--bg)" strokeWidth={2} />
                ) : (
                  <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={4} fill="var(--bg-surface-2)" stroke={hex} strokeWidth={2} />
                );
              }}
              activeDot={{ r: 6, fill: lineColor, stroke: "var(--bg)", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "20px", marginTop: "14px", fontSize: "10px", color: "var(--text-faint)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--text-muted)", display: "inline-block" }} />
          Observed
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", border: "1.5px solid var(--text-muted)", display: "inline-block" }} />
          Forecast
        </span>
      </div>
    </div>
  );
}
