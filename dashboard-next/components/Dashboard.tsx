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

const DASHBOARD_SECTIONS = [
  { id: "overview",     label: "Overview" },
  { id: "forecast",     label: "Forecast" },
  { id: "composition",  label: "Air Composition" },
  { id: "history",      label: "History" },
  { id: "models",       label: "Model Lab" },
  { id: "features",     label: "Features" },
  { id: "data",         label: "Data" },
  { id: "mlops",        label: "MLOps" },
  { id: "audit",        label: "Audit" },
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
          observationTime={currentObservation?.timestamp}
          generatedTime={currentForecast?.generated_at}
          modelName="Random Forest"
          modelVersion={currentForecast?.model_version || 1}
        />

        {/* ═══════════════════════════════════════
            SECTION 1 — COMMAND CENTER OVERVIEW
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
                  aqi={currentObservation?.us_aqi ?? currentForecast?.predicted_aqi_24h}
                  observationTimestamp={currentObservation?.timestamp}
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
                    currentAQI={currentObservation?.us_aqi ?? currentForecast?.predicted_aqi_24h}
                    forecast72hAQI={currentForecast?.predicted_aqi_72h}
                    primaryPollutant="PM2.5"
                  />
                </div>
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
                currentAQI={currentObservation?.us_aqi}
                forecast24h={currentForecast?.predicted_aqi_24h}
                forecast48h={currentForecast?.predicted_aqi_48h}
                forecast72h={currentForecast?.predicted_aqi_72h}
                timestamp24h={currentForecast?.forecast_for_24h}
                timestamp48h={currentForecast?.forecast_for_48h}
                timestamp72h={currentForecast?.forecast_for_72h}
              />

              <ForecastChart
                city={city}
                observationAQI={currentObservation?.us_aqi}
                observationTime={currentObservation?.timestamp}
                forecast24h={currentForecast?.predicted_aqi_24h}
                forecast48h={currentForecast?.predicted_aqi_48h}
                forecast72h={currentForecast?.predicted_aqi_72h}
                time24h={currentForecast?.forecast_for_24h}
                time48h={currentForecast?.forecast_for_48h}
                time72h={currentForecast?.forecast_for_72h}
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
          testR2={data.best?.final_test_metrics?.r2_24h ?? 0.827}
          modelName="Random Forest"
          leakageGatesPassing={6}
        />

        {/* ═══════════════════════════════════════
            SECTION 3 — AIR COMPOSITION & WEATHER
        ═══════════════════════════════════════ */}
        <section id="composition" className="section-anchor section-block">
          <div style={{ marginBottom: "36px" }}>
            <p className="section-label">Atmospheric telemetry</p>
            <h2 className="section-heading">Chemical Composition &amp; Meteorological Context</h2>
            <p className="section-description">
              In-situ particulate concentrations, trace gas telemetry, and thermodynamic dispersion vectors for {city}.
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
            SECTION 5 — MODEL LAB
        ═══════════════════════════════════════ */}
        <section id="models" className="section-anchor section-block">
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
        </section>

        <div className="section-divider" />

        {/* ═══════════════════════════════════════
            SECTION 6 — FEATURE INTELLIGENCE
        ═══════════════════════════════════════ */}
        <section id="features" className="section-anchor section-block">
          <div style={{ marginBottom: "36px" }}>
            <p className="section-label">Feature engineering &amp; SHAP</p>
            <h2 className="section-heading">Feature Architecture &amp; Explainable AI</h2>
            <p className="section-description">
              354 engineered signals across 9 mathematical families, ranked by global SHAP TreeExplainer weights.
            </p>
          </div>

          <FeatureIntelligencePanel features={data.features || []} />
        </section>

        <div className="section-divider" />

        {/* ═══════════════════════════════════════
            SECTION 7 — DATA FOUNDATION
        ═══════════════════════════════════════ */}
        <section id="data" className="section-anchor section-block">
          <div style={{ marginBottom: "36px" }}>
            <p className="section-label">Data foundation &amp; quality</p>
            <h2 className="section-heading">Four Years of Verified Atmospheric Records</h2>
            <p className="section-description">
              105,912 continuous hourly observations from Open-Meteo with zero missing hours and verified physical ranges.
            </p>
          </div>

          <DataFoundationPanel qualityReport={data.quality || {}} />
        </section>

        <div className="section-divider" />

        {/* ═══════════════════════════════════════
            SECTION 8 — MLOPS
        ═══════════════════════════════════════ */}
        <section id="mlops" className="section-anchor section-block">
          <div style={{ marginBottom: "36px" }}>
            <p className="section-label">MLOps &amp; automation</p>
            <h2 className="section-heading">End-to-End Automated Pipeline</h2>
            <p className="section-description">
              Scheduled hourly ingestion, Hopsworks feature versioning, daily automated training, and edge API inference.
            </p>
          </div>

          <MLOpsPanel />
        </section>

        <div className="section-divider" />

        {/* ═══════════════════════════════════════
            SECTION 9 — AUDIT & TRUST
        ═══════════════════════════════════════ */}
        <section id="audit" className="section-anchor section-block">
          <div style={{ marginBottom: "36px" }}>
            <p className="section-label">Trust &amp; governance</p>
            <h2 className="section-heading">Independent Audit &amp; Leakage Gates</h2>
            <p className="section-description">
              All 6 data leakage checks verified programmatically with reproducible test coverage and artifact integrity.
            </p>
          </div>

          <AuditTrustPanel leakageReport={data.leakage || {}} />
        </section>

      </div>

      {/* Observability Drawer */}
      <ExplanationDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        city={city}
        topFeatures={data.features || []}
        currentAQI={currentObservation?.us_aqi}
        forecast24h={currentForecast?.predicted_aqi_24h}
      />

      {/* Footer */}
      <footer className="site-footer">
        <span className="footer-brand">PEARLS AIR INTELLIGENCE</span>
        <span>
          Artifact generated:{" "}
          {currentForecast?.generated_at
            ? new Date(currentForecast.generated_at).toUTCString()
            : "Live"}
        </span>
      </footer>
    </main>
  );
}
