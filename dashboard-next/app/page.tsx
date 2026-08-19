import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import { loadDashboardData } from "@/lib/data";
import { getAQICategory, getCategoryHex, calculateTrend } from "@/lib/aqi";

export default async function LandingPage() {
  const data = await loadDashboardData();

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <SiteHeader />

      {/* ─── Hero ─── */}
      <section className="homepage-hero">
        <p className="hero-eyebrow">Pearls Air Intelligence</p>

        <h1 className="hero-headline">
          Know the air<br />before you breathe it.
        </h1>

        <p className="hero-subline">
          72-hour AQI forecasts for Karachi, Lahore, and Islamabad. Built on four years of continuous atmospheric telemetry and validated machine-learning models.
        </p>

        <div className="hero-cta-row">
          <Link href="/dashboard" className="btn-primary">
            View forecast <ArrowRight size={14} />
          </Link>
          <Link href="/methodology" className="btn-ghost">
            Explore methodology
          </Link>
        </div>

        {/* City Signal System */}
        <div className="city-signals">
          {data.forecasts.map((f: any) => {
            const aqi24 = Math.round(Number(f.predicted_aqi_24h));
            const aqi72 = Math.round(Number(f.predicted_aqi_72h));
            const cat = String(f.category_24h || getAQICategory(aqi24));
            const colorHex = getCategoryHex(cat);
            const trend = calculateTrend(aqi24, aqi72);

            return (
              <Link
                key={f.city}
                href={`/dashboard?city=${encodeURIComponent(f.city)}`}
                className="city-signal-card"
                aria-label={`${f.city} — ${aqi24} AQI, ${cat}`}
              >
                <span className="city-signal-city">{f.city}</span>
                <span
                  className="city-signal-aqi tabular"
                  style={{ color: colorHex }}
                >
                  {aqi24}
                </span>
                <span className="city-signal-category">{cat}</span>
                <span
                  className="city-signal-trend"
                  style={{
                    color:
                      trend.direction === "worsening"
                        ? "var(--aqi-unhealthy)"
                        : trend.direction === "improving"
                        ? "var(--aqi-good)"
                        : "var(--text-faint)",
                  }}
                >
                  72h {trend.label}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ─── Trust Strip ─── */}
      <section className="trust-strip">
        <div className="trust-strip-inner">
          <div className="trust-stat">
            <span className="trust-stat-number tabular">105,912</span>
            <span className="trust-stat-desc">Verified hourly observations across 4 years of continuous telemetry</span>
          </div>
          <div className="trust-stat">
            <span className="trust-stat-number tabular">0.827</span>
            <span className="trust-stat-desc">24h test R² on the untouched chronological partition</span>
          </div>
          <div className="trust-stat">
            <span className="trust-stat-number tabular">6 / 6</span>
            <span className="trust-stat-desc">Leakage safety gates verified programmatically</span>
          </div>
        </div>
      </section>

      {/* ─── Architecture Pillars ─── */}
      <section
        style={{
          maxWidth: "1500px",
          margin: "0 auto",
          padding: "80px 4vw",
          width: "100%",
        }}
      >
        <div style={{ marginBottom: "48px" }}>
          <p className="section-label">Scientific foundation</p>
          <h2 className="section-heading">
            Not just another weather dashboard.
          </h2>
          <p className="section-description" style={{ marginTop: "10px" }}>
            Pearls connects real Open-Meteo observations, 354 engineered signals, Hopsworks feature versioning, and rigorous ML evaluation — with zero data leakage and full receipts.
          </p>
        </div>

        <div className="pillars-grid">
          <div className="pillar-block">
            <p className="pillar-number">01</p>
            <h3 className="pillar-title">354 Curated Predictors</h3>
            <p className="pillar-text">
              Rolling statistics, autoregressive memory checkpoints, non-linear interaction terms, and cyclical harmonics capture rapid pollution episodes. Every feature is leakage-safe.
            </p>
          </div>
          <div className="pillar-block">
            <p className="pillar-number">02</p>
            <h3 className="pillar-title">Zero Data Leakage</h3>
            <p className="pillar-text">
              Time flows directionally. Target construction, scaling, and rolling aggregations respect city isolation and strict chronological boundaries — verified by 6 automated gates.
            </p>
          </div>
          <div className="pillar-block">
            <p className="pillar-number">03</p>
            <h3 className="pillar-title">Explainable AI (SHAP)</h3>
            <p className="pillar-text">
              Every prediction horizon is explainable. TreeExplainer measures global atmospheric decision weights without misleading directional claims about individual predictions.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="site-footer" style={{ marginTop: "auto" }}>
        <span className="footer-brand">PEARLS AIR INTELLIGENCE</span>
        <span>Real data · Honest metrics · Observable ML</span>
      </footer>
    </main>
  );
}
