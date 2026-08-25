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
  ReferenceArea,
} from "recharts";
import { getAQICategory, getCategoryHex } from "@/lib/aqi";
import { toPKT } from "@/lib/formatters";


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
  modelName?: string;
}

function ChartTooltip({ active, payload, city, modelName }: any) {
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
        minWidth: "180px",
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
      {d.timestamp && (
        <p style={{ fontSize: "10px", color: "var(--text-muted)", borderTop: "1px solid var(--border-faint)", paddingTop: "6px" }}>
          {d.timestamp}
        </p>
      )}
      {!d.isObservation && modelName && (
        <p style={{ fontSize: "10px", color: "var(--text-faint)", marginTop: "4px" }}>
          Model: {modelName}
        </p>
      )}
      {d.isObservation && (
        <p style={{ fontSize: "10px", color: "var(--text-faint)", marginTop: "4px" }}>
          Measured observation
        </p>
      )}
    </div>
  );
}

// AQI band definitions
const AQI_BANDS = [
  { y1: 0,   y2: 50,  color: "rgba(16, 185, 129, 0.06)",  label: "Good" },
  { y1: 50,  y2: 100, color: "rgba(212, 160, 23, 0.06)",   label: "Moderate" },
  { y1: 100, y2: 150, color: "rgba(232, 114, 58, 0.06)",   label: "Sensitive" },
  { y1: 150, y2: 200, color: "rgba(224, 82, 82, 0.06)",    label: "Unhealthy" },
  { y1: 200, y2: 300, color: "rgba(155, 89, 217, 0.06)",   label: "Very Unhealthy" },
  { y1: 300, y2: 500, color: "rgba(192, 40, 77, 0.06)",    label: "Hazardous" },
];

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
  modelName = "Random Forest",
}: ForecastChartProps) {
  const chartData = useMemo(() => {
    const points = [];
    if (observationAQI != null && Number.isFinite(observationAQI)) {
      points.push({
        horizon: "Now",
        displayLabel: "Observed",
        aqi: Math.round(observationAQI),
        category: getAQICategory(observationAQI),
        timestamp: observationTime ? toPKT(observationTime) : "Current observation",
        isObservation: true,
      });
    }
    if (forecast24h != null) {
      points.push({
        horizon: "+24h",
        displayLabel: "+24h Forecast",
        aqi: Math.round(forecast24h),
        category: getAQICategory(forecast24h),
        timestamp: time24h ? toPKT(time24h) : "+24 hours ahead",
        isObservation: false,
      });
    }
    if (forecast48h != null) {
      points.push({
        horizon: "+48h",
        displayLabel: "+48h Forecast",
        aqi: Math.round(forecast48h),
        category: getAQICategory(forecast48h),
        timestamp: time48h ? toPKT(time48h) : "+48 hours ahead",
        isObservation: false,
      });
    }
    if (forecast72h != null) {
      points.push({
        horizon: "+72h",
        displayLabel: "+72h Forecast",
        aqi: Math.round(forecast72h),
        category: getAQICategory(forecast72h),
        timestamp: time72h ? toPKT(time72h) : "+72 hours ahead",
        isObservation: false,
      });
    }
    return points;
  }, [observationAQI, observationTime, forecast24h, forecast48h, forecast72h, time24h, time48h, time72h]);

  const allAQI = chartData.map((d) => d.aqi);
  const maxAQI = Math.max(...allAQI, 50);
  const yMax = Math.min(Math.ceil((maxAQI + 30) / 50) * 50, 500);

  const forecastPoints = chartData.filter((d) => !d.isObservation);
  const lineColor = forecastPoints.length
    ? getCategoryHex(forecastPoints[forecastPoints.length - 1].category)
    : "var(--text-muted)";

  return (
    <div className="forecast-chart-wrapper">
      <div className="forecast-chart-header">
        <p className="forecast-chart-title">Discrete Forecast Trajectory · Now → +72h</p>
        <p style={{ fontSize: "10px", color: "var(--text-faint)" }}>
          {chartData.length} discrete points · Line shows progression, not interpolated hourly values
        </p>
      </div>

      <div className="forecast-chart-area">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 16, right: 16, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity={0.2} />
                <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
              </linearGradient>
            </defs>

            {/* AQI category band fills */}
            {AQI_BANDS.filter((b) => b.y1 < yMax).map((band) => (
              <ReferenceArea
                key={band.label}
                y1={band.y1}
                y2={Math.min(band.y2, yMax)}
                fill={band.color}
                fillOpacity={1}
                ifOverflow="hidden"
              />
            ))}

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
              domain={[0, yMax]}
              width={32}
            />

            {/* AQI threshold reference lines */}
            <ReferenceLine y={50}  stroke="rgba(16,185,129,0.25)"  strokeWidth={1} strokeDasharray="4 3" label={{ value: "Good", position: "insideTopRight", fill: "rgba(16,185,129,0.5)", fontSize: 9 }} />
            <ReferenceLine y={100} stroke="rgba(212,160,23,0.25)"  strokeWidth={1} strokeDasharray="4 3" label={{ value: "Moderate", position: "insideTopRight", fill: "rgba(212,160,23,0.5)", fontSize: 9 }} />
            <ReferenceLine y={150} stroke="rgba(232,114,58,0.25)"  strokeWidth={1} strokeDasharray="4 3" label={{ value: "Sensitive", position: "insideTopRight", fill: "rgba(232,114,58,0.5)", fontSize: 9 }} />

            <Tooltip
              content={<ChartTooltip city={city} modelName={modelName} />}
              cursor={{ stroke: "rgba(255,255,255,0.06)", strokeWidth: 1 }}
            />

            <Line
              type="linear"
              dataKey="aqi"
              stroke={lineColor}
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                const hex = getCategoryHex(payload.category);
                return payload.isObservation ? (
                  <circle key={`dot-obs-${cx}`} cx={cx} cy={cy} r={6} fill={hex} stroke="var(--bg)" strokeWidth={2} />
                ) : (
                  <circle key={`dot-fc-${cx}`} cx={cx} cy={cy} r={5} fill="var(--bg-surface-2)" stroke={hex} strokeWidth={2.5} />
                );
              }}
              activeDot={{ r: 7, fill: lineColor, stroke: "var(--bg)", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "20px", marginTop: "14px", fontSize: "10px", color: "var(--text-faint)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--text-muted)", display: "inline-block" }} />
          Observed
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", border: "2px solid var(--text-muted)", display: "inline-block" }} />
          Forecast · {modelName}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          Shaded bands = AQI categories
        </span>
      </div>
    </div>
  );
}
