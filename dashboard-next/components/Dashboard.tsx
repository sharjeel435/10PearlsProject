"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import SiteHeader from "@/components/SiteHeader";
import FreshnessIndicator from "@/components/ui/FreshnessIndicator";
import ExplanationDrawer from "@/components/ui/ExplanationDrawer";

import CitySelector from "@/components/dashboard/CitySelector";
import CurrentAQICard from "@/components/dashboard/CurrentAQICard";
import HealthIntelligenceCard from "@/components/dashboard/HealthIntelligenceCard";
import ForecastJourney from "@/components/dashboard/ForecastJourney";
import ForecastChart from "@/components/dashboard/ForecastChart";
import KPIRail from "@/components/dashboard/KPIRail";
import AirCompositionPanel from "@/components/dashboard/AirCompositionPanel";
import WeatherPanel from "@/components/dashboard/WeatherPanel";
import WeatherOutlookPanel from "@/components/dashboard/WeatherOutlookPanel";
import RuleBasedInsightsPanel from "@/components/dashboard/RuleBasedInsightsPanel";
import HistoryPanel from "@/components/dashboard/HistoryPanel";
import ModelLabPanel from "@/components/dashboard/ModelLabPanel";
import FeatureIntelligencePanel from "@/components/dashboard/FeatureIntelligencePanel";
import DataFoundationPanel from "@/components/dashboard/DataFoundationPanel";
import MLOpsPanel from "@/components/dashboard/MLOpsPanel";
import AuditTrustPanel from "@/components/dashboard/AuditTrustPanel";
import CityComparisonPanel from "@/components/dashboard/CityComparisonPanel";
import PakistanCityMap from "@/components/dashboard/PakistanCityMap";
import { toPKT } from "@/lib/formatters";

// Condensed from 9 → 6 tabs for cleaner navigation
const DASHBOARD_SECTIONS = [
  { id: "overview",     label: "Overview" },
  { id: "forecast",     label: "Forecast" },
  { id: "air-weather",  label: "Air & Weather" },
  { id: "history",      label: "History" },
  { id: "ml-lab",       label: "ML Lab" },
  { id: "mlops",        label: "MLOps" },
];

export default function Dashboard({ data }: { data: any }) {
  const [, startTransition] = useTransition();

  const [city, setCity] = useState<string>(() => {
    if (typeof window === "undefined") return "Karachi";
    const requested = new URLSearchParams(window.location.search).get("city");
    return requested && data.forecasts?.some((item: any) => item.city === requested)
      ? requested
      : "Karachi";
  });

  const [activeSection, setActiveSection] = useState<string>("overview");
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  const cityList = useMemo(
    () => data.forecasts?.map((f: any) => f.city) || ["Karachi", "Lahore", "Islamabad"],
    [data.forecasts]
  );

  const currentForecast = useMemo(
    () => data.forecasts?.find((item: any) => item.city === city) ?? data.forecasts?.[0],
    [data.forecasts, city]
  );

  const currentObservation = useMemo(
    () => data.observations?.find((item: any) => item.city === city),
    [data.observations, city]
  );

  // Determine if we're showing an observed AQI or falling back to forecast
  const hasObservation = currentObservation?.us_aqi != null && Number.isFinite(currentObservation.us_aqi);
  const displayAQI = hasObservation
    ? currentObservation.us_aqi
    : (currentForecast?.predicted_aqi_24h ?? currentForecast?.forecasts?.["24h"]?.aqi ?? null);

  const selectCity = (cityName: string) => {
    startTransition(() => {
      setCity(cityName);
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", `/dashboard?city=${encodeURIComponent(cityName)}`);
      }
    });
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY + 160;
      for (const section of DASHBOARD_SECTIONS) {
        const el = document.getElementById(section.id);
        if (el) {
          const { offsetTop, offsetHeight } = el;
          if (scrollY >= offsetTop && scrollY < offsetTop + offsetHeight) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Extract forecast timestamps
  const forecast24hTime = currentForecast?.forecast_for_24h ?? currentForecast?.forecasts?.["24h"]?.timestamp;
  const forecast48hTime = currentForecast?.forecast_for_48h ?? currentForecast?.forecasts?.["48h"]?.timestamp;
  const forecast72hTime = currentForecast?.forecast_for_72h ?? currentForecast?.forecasts?.["72h"]?.timestamp;
  const forecast24hAQI  = currentForecast?.predicted_aqi_24h ?? currentForecast?.forecasts?.["24h"]?.aqi ?? null;
  const forecast48hAQI  = currentForecast?.predicted_aqi_48h ?? currentForecast?.forecasts?.["48h"]?.aqi ?? null;
  const forecast72hAQI  = currentForecast?.predicted_aqi_72h ?? currentForecast?.forecasts?.["72h"]?.aqi ?? null;

  const generatedAt = currentForecast?.generated_at;
  const observationAt = currentObservation?.timestamp;

  return (
    <main>
      <SiteHeader />

      {/* In-Page Sticky Nav */}
      <div className="dashboard-subnav-sticky">
        <div className="subnav-inner">
          <div className="subnav-tabs">
            {DASHBOARD_SECTIONS.map((sec) => {
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  className={`subnav-tab${isActive ? " active" : ""}`}
                  onClick={() => scrollToSection(sec.id)}
                  aria-current={isActive ? "true" : undefined}
                >
                  {sec.label}
                  {isActive && (
                    <motion.div
                      layoutId="subnav-underline"
                      className="subnav-tab-underline"
                      transition={{ type: "spring", stiffness: 400, damping: 34 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <CitySelector
            cities={cityList}
            activeCity={city}
            onSelectCity={selectCity}
          />
        </div>
      </div>

      <div className="dashboard-container">

        {/* Freshness indicator */}
        <FreshnessIndicator
          observationTime={observationAt}
          generatedTime={generatedAt}
          modelName={currentForecast?.model === "aqi_random_forest" ? "Random Forest" : (currentForecast?.model ?? "Random Forest")}
          modelVersion={currentForecast?.model_version || 1}
        />

        {/* ═══════════════════════════════════════
            SECTION 1 — OVERVIEW
        ═══════════════════════════════════════ */}
        <section id="overview" className="section-anchor section-block">

          <AnimatePresence mode="wait">
            <motion.div
              key={city}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Asymmetric hero: AQI (7 cols) + outlook/health (5 cols) */}
              <div className="command-hero-top">
                <CurrentAQICard
                  city={city}
                  aqi={displayAQI}
                  aqiIsObserved={hasObservation}
                  observationTimestamp={hasObservation ? observationAt : forecast24hTime}
                  onExploreClick={() => setDrawerOpen(true)}
                />

                <div className="outlook-panel">
                  <div className="outlook-header">
                    <p className="outlook-title">72-Hour Outlook</p>
                    <p className="outlook-summary">
                      {city} air quality trajectory
                    </p>
                  </div>

                  <HealthIntelligenceCard
                    currentAQI={displayAQI}
                    forecast72hAQI={forecast72hAQI}
                    observation={currentObservation}
                  />
                </div>
              </div>

              {/* City comparison + Pakistan map */}
              <div className="city-overview-grid" style={{ marginTop: "32px" }}>
                <CityComparisonPanel
                  forecasts={data.forecasts || []}
                  observations={data.observations || []}
                  activeCity={city}
                  onSelectCity={selectCity}
                />
                <PakistanCityMap
                  forecasts={data.forecasts || []}
                  observations={data.observations || []}
                  activeCity={city}
                  onSelectCity={selectCity}
                />
              </div>
            </motion.div>
          </AnimatePresence>

          <WeatherOutlookPanel city={city} outlooks={data.weatherOutlooks || []} />
          <RuleBasedInsightsPanel city={city} insights={data.ruleBasedInsights || []} />
        </section>

        {/* ═══════════════════════════════════════
            SECTION 2 — FORECAST RIBBON
        ═══════════════════════════════════════ */}
        <section id="forecast" className="section-anchor">
          <AnimatePresence mode="wait">
            <motion.div
              key={city + "-forecast"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <ForecastJourney
                currentAQI={displayAQI}
                forecast24h={forecast24hAQI}
                forecast48h={forecast48hAQI}
                forecast72h={forecast72hAQI}
                timestamp24h={forecast24hTime}
                timestamp48h={forecast48hTime}
                timestamp72h={forecast72hTime}
              />

              <ForecastChart
                city={city}
                observationAQI={currentObservation?.us_aqi ?? null}
                observationTime={observationAt}
                forecast24h={forecast24hAQI}
                forecast48h={forecast48hAQI}
                forecast72h={forecast72hAQI}
                time24h={forecast24hTime}
                time48h={forecast48hTime}
                time72h={forecast72hTime}
                modelName="Random Forest"
              />
            </motion.div>
          </AnimatePresence>
        </section>

        {/* ═══════════════════════════════════════
            KPI STAT STRIP
        ═══════════════════════════════════════ */}
        <KPIRail
          totalRows={data.quality?.clean_records || 105912}
          featureCount={data.training?.valid_features || 354}
          testR2_24h={data.best?.final_test_metrics?.r2_24h ?? 0.824}
          modelName="Random Forest"
          leakageGatesPassing={6}
        />

        {/* ═══════════════════════════════════════
            SECTION 3 — AIR & WEATHER
        ═══════════════════════════════════════ */}
        <section id="air-weather" className="section-anchor section-block">
          <div style={{ marginBottom: "36px" }}>
            <p className="section-label">Atmospheric telemetry</p>
            <h2 className="section-heading">Air Composition &amp; Weather Context</h2>
            <p className="section-description">
              Particulate concentrations, trace gas measurements, and meteorological conditions for {city}.
              {!hasObservation && (
                <span style={{ color: "var(--aqi-moderate)", marginLeft: "6px" }}>
                  · Observation data is stale — showing last available reading
                </span>
              )}
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={city + "-composition"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="atmospheric-grid"
            >
              <AirCompositionPanel observation={currentObservation} />
              <WeatherPanel observation={currentObservation} />
            </motion.div>
          </AnimatePresence>
        </section>

        <div className="section-divider" />

        {/* ═══════════════════════════════════════
            SECTION 4 — HISTORY
        ═══════════════════════════════════════ */}
        <section id="history" className="section-anchor section-block">
          <div style={{ marginBottom: "36px" }}>
            <p className="section-label">Historical observations</p>
            <h2 className="section-heading">30-Day Air Quality Trends</h2>
            <p className="section-description">
              Verified daily average AQI and PM2.5 concentrations over the previous month for {city}.
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={city + "-history"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <HistoryPanel city={city} historicalData={data.historical || []} />
            </motion.div>
          </AnimatePresence>
        </section>

        <div className="section-divider" />

        {/* ═══════════════════════════════════════
            SECTION 5 — ML LAB
            (Model + Features + Data + Audit combined)
        ═══════════════════════════════════════ */}
        <section id="ml-lab" className="section-anchor section-block">

          {/* Model Performance */}
          <div style={{ marginBottom: "36px" }}>
            <p className="section-label">Model benchmark &amp; evaluation</p>
            <h2 className="section-heading">Model Performance Laboratory</h2>
            <p className="section-description">
              Validation selection benchmarks across 5 candidate architectures alongside final untouched test partition metrics.
            </p>
          </div>

          <ModelLabPanel
            models={data.models || []}
            bestModel={data.best || {}}
            cityMetrics={data.cityMetrics || []}
            trainingSummary={data.training || {}}
          />

          <div className="section-divider" style={{ margin: "56px 0" }} />

          {/* Feature Intelligence */}
          <div style={{ marginBottom: "36px" }}>
            <p className="section-label">Feature engineering &amp; SHAP</p>
            <h2 className="section-heading">Feature Architecture &amp; Explainable AI</h2>
            <p className="section-description">
              354 engineered signals across 9 mathematical families, ranked by global SHAP TreeExplainer weights.
            </p>
          </div>

          <FeatureIntelligencePanel features={data.features || []} />

          <div className="section-divider" style={{ margin: "56px 0" }} />

          {/* Data Foundation */}
          <div style={{ marginBottom: "36px" }}>
            <p className="section-label">Data foundation &amp; quality</p>
            <h2 className="section-heading">Four Years of Verified Atmospheric Records</h2>
            <p className="section-description">
              105,912 continuous hourly observations from Open-Meteo with 100% timestamp coverage and verified physical ranges.
            </p>
          </div>

          <DataFoundationPanel qualityReport={data.quality || {}} />

          <div className="section-divider" style={{ margin: "56px 0" }} />

          {/* Audit & Trust */}
          <div style={{ marginBottom: "36px" }}>
            <p className="section-label">Trust &amp; governance</p>
            <h2 className="section-heading">ML Quality Assessment &amp; Leakage Gates</h2>
            <p className="section-description">
              Automated self-assessment across data integrity, leakage protection, evaluation methodology, and reproducibility.
            </p>
          </div>

          <AuditTrustPanel leakageReport={data.leakage || {}} />
        </section>

        <div className="section-divider" />

        {/* ═══════════════════════════════════════
            SECTION 6 — MLOPS
        ═══════════════════════════════════════ */}
        <section id="mlops" className="section-anchor section-block">
          <div style={{ marginBottom: "36px" }}>
            <p className="section-label">MLOps &amp; automation</p>
            <h2 className="section-heading">End-to-End Automated Pipeline</h2>
            <p className="section-description">
              Scheduled hourly ingestion, Hopsworks feature versioning, daily automated training, and REST API inference.
            </p>
          </div>

          <MLOpsPanel
            generatedAt={generatedAt}
            observationAt={observationAt}
          />
        </section>

      </div>

      {/* Observability Drawer */}
      <ExplanationDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        city={city}
        topFeatures={data.features || []}
        currentAQI={displayAQI}
        forecast24h={forecast24hAQI}
      />

      {/* Footer */}
      <footer className="site-footer">
        <span className="footer-brand">PEARLS AIR INTELLIGENCE</span>
        <span>
          Forecast updated:{" "}
          {generatedAt
            ? toPKT(generatedAt)
            : "Not available"}
        </span>
      </footer>
    </main>
  );
}
