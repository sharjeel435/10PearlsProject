"use client";

import { useMemo, useState } from "react";
import type { CityHorizonInsights } from "@/lib/air-quality-insights";

export default function RuleBasedInsightsPanel({ city, insights }: { city: string; insights: CityHorizonInsights[] }) {
  const [horizon, setHorizon] = useState("24h");
  const result = useMemo(
    () => insights.find((item) => item.city === city && item.horizon === horizon),
    [city, horizon, insights],
  );
  const latestStagnation = result?.stagnationIndex[0];

  return (
    <section className="rule-insights" aria-labelledby="rule-insights-title">
      <div className="rule-insights-head">
        <div>
          <p className="section-label">Rule-based health guidance</p>
          <h2 id="rule-insights-title" className="section-heading">Today&apos;s Actionable Air Insights</h2>
          <p className="section-description">Transparent formulas calculated from hourly Open-Meteo data—no AI or ML.</p>
        </div>
        <div className="rule-horizons" aria-label="Forecast horizon">
          {["24h", "48h", "72h"].map((value) => (
            <button key={value} className={horizon === value ? "active" : ""} onClick={() => setHorizon(value)}>{value}</button>
          ))}
        </div>
      </div>
      {result ? (
        <div className="rule-insights-grid">
          <article className="rule-insight-card">
            <span className="rule-kicker">PM2.5 exposure</span>
            <strong>{result.cigaretteEquivalent.cigarettes.toFixed(1)}</strong>
            <span>cigarette equivalent</span>
            <p>{result.cigaretteEquivalent.summary}</p>
          </article>
          <article className="rule-insight-card">
            <span className="rule-kicker">Pollution trap risk</span>
            <strong>{latestStagnation?.score ?? "—"}<small>/100</small></strong>
            <span>stagnation index</span>
            <p>{latestStagnation?.label ?? "Weather inputs unavailable"}</p>
          </article>
          <article className="rule-insight-card rule-insight-wide">
            <span className="rule-kicker">Best time outside</span>
            <strong>{result.bestOutdoorWindow.bestHour ? new Date(result.bestOutdoorWindow.bestHour.time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "—"}</strong>
            <span>{result.bestOutdoorWindow.bestHour ? `AQI ${Math.round(result.bestOutdoorWindow.bestHour.aqi)}` : "No hourly data"}</span>
            <p>{result.bestOutdoorWindow.summary}</p>
          </article>
        </div>
      ) : <p className="rule-insights-empty">Live hourly insights are temporarily unavailable.</p>}
    </section>
  );
}
