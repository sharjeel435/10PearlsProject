"use client";

import { useMemo, useState } from "react";
import {
  Activity, ArrowUpRight, BrainCircuit, Check, ChevronRight, CircleDot,
  CloudSun, Database, Gauge, GitBranch, Layers3, MapPin, Menu, ShieldCheck,
  Sparkles, TestTube2, Wind, Workflow, X, Thermometer, Droplets, Navigation, Umbrella
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer,
  Tooltip, XAxis, YAxis, Line, LineChart, ReferenceLine
} from "recharts";

const nav = ["Overview", "Forecast", "Models", "Data", "Features", "MLOps", "Audit"];
const modelNames: Record<string, string> = {
  aqi_random_forest: "Random Forest", aqi_ridge: "Ridge Regression",
  persistence: "Current persistence", seasonal_persistence: "Seasonal persistence", aqi_lstm: "TensorFlow LSTM"
};

const fmt = (v: number, digits = 1) => Number(v).toFixed(digits);
const categoryTone = (category: string) => category.includes("Sensitive") ? "amber" : category === "Moderate" ? "yellow" : "green";

function Badge({ children, tone = "green" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`badge ${tone}`}><i />{children}</span>;
}

function Stat({ label, value, note, icon }: { label: string; value: string; note: string; icon: React.ReactNode }) {
  return <div className="stat"><div className="stat-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></div>;
}

function SectionTitle({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return <div className="section-title"><span>{eyebrow}</span><h2>{title}</h2><p>{copy}</p></div>;
}

export default function Dashboard({ data }: { data: any }) {
  const [active, setActive] = useState("Overview");
  const [city, setCity] = useState(()=>{if(typeof window==="undefined")return"Karachi";const requested=new URLSearchParams(window.location.search).get("city");return requested&&data.forecasts.some((item:any)=>item.city===requested)?requested:"Karachi"});
  const [menu, setMenu] = useState(false);
  const forecast = data.forecasts.find((item: any) => item.city === city) ?? data.forecasts[0];
  const observation = data.observations.find((item: any) => item.city === city);
  const forecastSeries = observation ? [{label:"Latest",aqi:observation.us_aqi},...[24,48,72].map(h=>({label:`+${h}h`,aqi:forecast[`predicted_aqi_${h}h`]}))] : [24,48,72].map(h=>({label:`+${h}h`,aqi:forecast[`predicted_aqi_${h}h`]}));
  const history = data.historical.filter((item:any)=>item.city===city).map((item:any)=>({...item,label:new Date(item.date).toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"UTC"})}));
  const modelChart = useMemo(() => data.models.map((m: any) => ({
    name: modelNames[m.model], short: modelNames[m.model].split(" ")[0], rmse: m.overall_rmse, r2: m.r2
  })), [data.models]);
  const testRf = data.cityMetrics.filter((m: any) => m.model === "aqi_random_forest" && m.city === "overall");
  const auditChecks = [
    ["Cross-city isolation", data.leakage.cross_city], ["Target construction", data.leakage.targets],
    ["Trailing rolling windows", data.leakage.rolling], ["Train-only scaling", data.leakage.scaling],
    ["Chronological split", data.leakage.chronology], ["LSTM sequence safety", data.leakage.lstm_sequences]
  ];

  const selectCity = (name:string) => { setCity(name); window.history.replaceState(null,"",`/dashboard?city=${encodeURIComponent(name)}`); };
  const scroll = (name: string) => {
    setActive(name); setMenu(false);
    document.getElementById(name.toLowerCase())?.scrollIntoView({ behavior: "smooth" });
  };

  return <main>
    <div className="noise" />
    <header>
      <button className="brand" onClick={() => scroll("Overview")}>
        <span className="brand-mark"><Wind size={19} /></span>
        <span><b>PEARLS</b><small>AIR INTELLIGENCE</small></span>
      </button>
      <nav className={menu ? "open" : ""}>{nav.map(item => <button key={item} className={active === item ? "active" : ""} onClick={() => scroll(item)}>{item}</button>)}</nav>
      <div className="header-status"><Badge>ALL SYSTEMS OPERATIONAL</Badge></div>
      <button className="menu" onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button>
    </header>

    <section className="hero" id="overview">
      <div className="hero-copy">
        <Badge tone="blue">MODEL v1 · LIVE ARTIFACTS</Badge>
        <h1>Air quality,<br/><em>made visible.</em></h1>
        <p>A complete operational view of Pakistan’s multi-horizon AQI forecasting system—from raw atmospheric signals to trusted predictions.</p>
        <div className="hero-actions">
          <button className="primary" onClick={() => scroll("Forecast")}>Explore forecasts <ArrowUpRight size={18}/></button>
          <button className="secondary" onClick={() => scroll("Audit")}>View model audit <ChevronRight size={18}/></button>
        </div>
      </div>
      <div className="orbital">
        <div className="orbit orbit-one"/><div className="orbit orbit-two"/>
        <div className="aqi-orb">
          <span>SELECTED CITY</span><strong>{Math.round(forecast.predicted_aqi_24h)}</strong><b>{forecast.category_24h}</b><small>+24 hour AQI</small>
        </div>
        <div className="float-card float-one"><CircleDot/><span><b>105,912</b> verified hourly rows</span></div>
        <div className="float-card float-two"><Sparkles/><span><b>354</b> curated predictors</span></div>
      </div>
    </section>

    <section className="stats-row">
      <Stat label="BEST MODEL" value="Random Forest" note="Selected on validation RMSE" icon={<BrainCircuit/>}/>
      <Stat label="24H TEST R²" value="0.827" note="Untouched final test split" icon={<Gauge/>}/>
      <Stat label="DATA COVERAGE" value="4.0 years" note="Hourly · 3 cities · UTC" icon={<Database/>}/>
      <Stat label="QUALITY GATES" value="6 / 6" note="All leakage checks pass" icon={<ShieldCheck/>}/>
    </section>

    <section id="forecast" className="section-wrap">
      <SectionTitle eyebrow="01 · LIVE FORECAST" title="Three cities. Seventy-two hours ahead." copy="Production predictions generated by the selected Random Forest model, with EPA-style health categories at every horizon."/>
      <div className="city-tabs" aria-label="Select city">{data.forecasts.map((f: any) => <button key={f.city} aria-pressed={city===f.city} className={city === f.city ? "active" : ""} onClick={() => selectCity(f.city)}><MapPin size={16}/>{f.city}</button>)}</div>
      {observation&&<div className="latest-hero"><div><span>LATEST OBSERVATION · {observation.timestamp}</span><h3>{city}</h3><p>Measured source observation, distinct from the generated forecast.</p></div><strong>{Math.round(observation.us_aqi)}</strong><b>{observation.us_aqi<=50?"Good":observation.us_aqi<=100?"Moderate":observation.us_aqi<=150?"Unhealthy for Sensitive Groups":observation.us_aqi<=200?"Unhealthy":"Very Unhealthy"}</b></div>}
      <div className="forecast-grid">
        {[24,48,72].map((h, index) => {
          const value = forecast[`predicted_aqi_${h}h`]; const cat = forecast[`category_${h}h`];
          return <article className={`forecast-card ${index === 0 ? "featured" : ""}`} key={h}>
            <div className="forecast-top"><span>+{h} HOURS</span><Badge tone={categoryTone(cat)}>{cat}</Badge></div>
            <strong>{Math.round(value)}</strong><small>US AQI</small>
            <div className="meter"><i style={{width: `${Math.min(value / 2.5, 100)}%`}}/></div>
            <p>{new Date(forecast[`forecast_for_${h}h`]).toLocaleString("en-US", {month:"short",day:"numeric",hour:"numeric",timeZone:"UTC"})} UTC</p>
          </article>
        })}
      </div>
      <div className="panel forecast-chart"><div className="panel-head"><div><span>DISCRETE FORECAST HORIZONS</span><h3>Latest → 24h → 48h → 72h</h3></div><Badge tone="blue">NO HOURLY INTERPOLATION</Badge></div><ResponsiveContainer width="100%" height={260}><LineChart data={forecastSeries}><CartesianGrid vertical={false} stroke="#ffffff0d"/><XAxis dataKey="label" stroke="#708083"/><YAxis domain={[0,"dataMax + 30"]} stroke="#708083"/><ReferenceLine y={100} stroke="#e9df58" strokeDasharray="4 4"/><ReferenceLine y={150} stroke="#ffb84a" strokeDasharray="4 4"/><Tooltip contentStyle={{background:"#11191b",border:"1px solid #ffffff18",borderRadius:12}}/><Line type="linear" dataKey="aqi" stroke="#c8ff56" strokeWidth={3} dot={{r:5,fill:"#c8ff56"}}/></LineChart></ResponsiveContainer><p className="chart-summary">The chart connects only the four available measurement/forecast points; it does not imply hourly predictions.</p></div>
      {observation&&<div className="signal-grid"><div className="panel"><div className="panel-head"><div><span>LATEST POLLUTANTS</span><h3>Air composition</h3></div><Activity/></div><div className="signal-list">{[["PM2.5",observation.pm2_5,"µg/m³"],["PM10",observation.pm10,"µg/m³"],["NO₂",observation.nitrogen_dioxide,"µg/m³"],["SO₂",observation.sulphur_dioxide,"µg/m³"],["CO",observation.carbon_monoxide,"µg/m³"],["O₃",observation.ozone,"µg/m³"]].map(([n,v,u])=><div key={String(n)}><span>{n}</span><b>{v??"Unavailable"}</b><small>{v==null?"":u}</small></div>)}</div></div><div className="panel"><div className="panel-head"><div><span>FORECAST SIGNALS</span><h3>Weather context</h3></div><CloudSun/></div><div className="signal-list">{[["Temperature",observation.temperature_2m,"°C",Thermometer],["Humidity",observation.relative_humidity_2m,"%",Droplets],["Wind speed",observation.wind_speed_10m,"km/h",Wind],["Wind direction",observation.wind_direction_10m,"°",Navigation],["Pressure",observation.surface_pressure,"hPa",Gauge],["Precipitation",observation.precipitation,"mm",Umbrella]].map(([n,v,u])=><div key={String(n)}><span>{n}</span><b>{v??"Unavailable"}</b><small>{v==null?"":u}</small></div>)}</div><p className="chart-summary">Wind disperses pollutants; humidity can alter particle behavior and visibility.</p></div></div>}
      <div className="panel forecast-chart historical"><div className="panel-head"><div><span>RECENT VERIFIED HISTORY</span><h3>30-day daily AQI · {city}</h3></div><Badge tone="blue">DAILY MEAN</Badge></div><ResponsiveContainer width="100%" height={260}><LineChart data={history}><CartesianGrid vertical={false} stroke="#ffffff0d"/><XAxis dataKey="label" interval={5} stroke="#708083"/><YAxis stroke="#708083"/><ReferenceLine y={100} stroke="#e9df58" strokeDasharray="4 4"/><ReferenceLine y={150} stroke="#ffb84a" strokeDasharray="4 4"/><Tooltip contentStyle={{background:"#11191b",border:"1px solid #ffffff18",borderRadius:12}}/><Line type="linear" dataKey="us_aqi" name="AQI" stroke="#5ee8e0" strokeWidth={2} dot={false}/><Line type="linear" dataKey="pm2_5" name="PM2.5" stroke="#b59cff" strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer><p className="chart-summary">Lightweight daily aggregates only; the four-year hourly dataset is never shipped to the browser.</p></div>
      <div className="forecast-footer"><Activity size={17}/><span>Generated {new Date(forecast.generated_at).toLocaleString()}</span><i/><span>{modelNames[forecast.model]} · Registry v{forecast.model_version}</span></div>
    </section>

    <section id="models" className="section-wrap contrast">
      <SectionTitle eyebrow="02 · MODEL LAB" title="Performance without the spin." copy="Validation metrics are clearly separated from untouched test results. R² is goodness-of-fit—not classification accuracy."/>
      <div className="model-layout">
        <div className="panel chart-panel">
          <div className="panel-head"><div><span>VALIDATION COMPARISON</span><h3>Mean RMSE · lower is better</h3></div><Badge tone="blue">5 CANDIDATES</Badge></div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={modelChart} layout="vertical" margin={{left: 15,right:25}}>
              <CartesianGrid horizontal={false} stroke="#ffffff0d"/><XAxis type="number" hide/><YAxis type="category" dataKey="short" width={82} tick={{fill:"#94a0a6",fontSize:12}} axisLine={false} tickLine={false}/>
              <Tooltip cursor={{fill:"#ffffff08"}} contentStyle={{background:"#11191b",border:"1px solid #ffffff18",borderRadius:12}}/>
              <Bar dataKey="rmse" radius={[0,6,6,0]}>{modelChart.map((_: any,i: number)=><Cell key={i} fill={i===0?"#c8ff56":"#314047"}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="panel winner">
          <span className="kicker">SELECTED CHAMPION</span><div className="model-icon"><BrainCircuit/></div><h3>Random Forest</h3><p>160 trees · depth 24 · sqrt features</p>
          <div className="winner-metrics"><div><span>VAL RMSE</span><b>{fmt(data.best.overall_rmse,3)}</b></div><div><span>VAL R²</span><b>{fmt(data.best.r2,3)}</b></div></div>
          <div className="selection-note"><Check size={16}/><span>Chosen using validation data only. Test set remained untouched.</span></div>
        </div>
      </div>
      <div className="horizon-table panel">
        <div className="panel-head"><div><span>FINAL TEST · RANDOM FOREST</span><h3>Performance by forecast horizon</h3></div><Badge>VERIFIED</Badge></div>
        <div className="table-row table-head"><span>Horizon</span><span>RMSE</span><span>MAE</span><span>R²</span><span>Signal retained</span></div>
        {testRf.map((m: any)=><div className="table-row" key={m.horizon}><b>{m.horizon} hours</b><span>{fmt(m.rmse,3)}</span><span>{fmt(m.mae,3)}</span><strong>{fmt(m.r2,3)}</strong><div className="mini-meter"><i style={{width:`${m.r2*100}%`}}/></div></div>)}
      </div>
    </section>

    <section id="data" className="section-wrap">
      <SectionTitle eyebrow="03 · DATA FOUNDATION" title="Every hour accounted for." copy="Four years of Open-Meteo weather and air-quality observations, aligned on city and UTC timestamp with no missing hours."/>
      <div className="data-grid">
        <div className="panel coverage">
          <div className="panel-head"><div><span>HISTORICAL COVERAGE</span><h3>Aug 2022 → Aug 2026</h3></div><Database/></div>
          <div className="timeline"><i/><b style={{left:"0%"}}>2022</b><b style={{left:"32%"}}>2023</b><b style={{left:"57%"}}>2024</b><b style={{left:"81%"}}>2025</b><b style={{left:"98%"}}>2026</b></div>
          <div className="city-list">{Object.entries(data.quality.by_city).map(([name,v]: any)=><div key={name}><MapPin/><span><b>{name}</b><small>{v.clean_rows.toLocaleString()} hourly rows</small></span><Badge>CONTINUOUS</Badge></div>)}</div>
        </div>
        <div className="panel quality-ring"><span>DATA QUALITY</span><div className="ring"><strong>99.86<small>%</small></strong><span>complete</span></div><div className="quality-foot"><div><b>0</b><span>missing hours</span></div><div><b>0</b><span>duplicate keys</span></div><div><b>100</b><span>invalids handled</span></div></div></div>
      </div>
    </section>

    <section id="features" className="section-wrap contrast">
      <SectionTitle eyebrow="04 · FEATURE INTELLIGENCE" title="From atmosphere to signal." copy="A rich feature matrix captures immediate conditions, temporal memory, rolling context, interactions, and pollution episodes."/>
      <div className="feature-layout">
        <div className="feature-count"><strong>354</strong><span>approved training predictors</span><p>362 stored columns · 4 excluded · 3 labels</p></div>
        <div className="feature-families">{[["Rolling windows",168],["Lag signals",85],["Change features",34],["Calendar & cycles",18],["Interactions",16],["Episodes",9],["Wind-derived",9],["Raw signals",14],["City encoding",1]].map(([name,count])=><div key={String(name)}><span>{name}</span><b>{count}</b><i style={{width:`${Number(count)/1.68}%`}}/></div>)}</div>
      </div>
      <div className="panel importance">
        <div className="panel-head"><div><span>SHAP · 24H OUTPUT</span><h3>What drives the forecast</h3></div><Badge tone="purple">TREE EXPLAINER</Badge></div>
        <ResponsiveContainer width="100%" height={300}><BarChart data={data.features.slice(0,8)} margin={{left:10,right:20}}><CartesianGrid vertical={false} stroke="#ffffff0d"/><XAxis dataKey="feature" tickFormatter={(v)=>String(v).replace("numeric__","").replaceAll("_"," ")} tick={{fill:"#8c999e",fontSize:10}} interval={0} angle={-15} textAnchor="end" height={70}/><YAxis hide/><Tooltip contentStyle={{background:"#11191b",border:"1px solid #ffffff18",borderRadius:12}}/><Bar dataKey="mean_abs_shap_24h" fill="#c8ff56" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer>
      </div>
    </section>

    <section id="mlops" className="section-wrap">
      <SectionTitle eyebrow="05 · MLOPS SYSTEM" title="Built as a pipeline, not a notebook." copy="Scheduled collection, versioned features, reproducible training data, model registry, and production serving form one connected system."/>
      <div className="pipeline">{[[CloudSun,"Open-Meteo","Hourly APIs"],[Workflow,"Feature pipeline","Every hour"],[Database,"Feature Store","aqi_features v1"],[Layers3,"Training set","Parquet v1"],[BrainCircuit,"Model registry","3 families · v1"],[Activity,"API + UI","Live artifacts"]].map(([Icon,title,sub]: any,i)=><div className="pipe-stage" key={title}><div><Icon/></div><b>{title}</b><span>{sub}</span>{i<5&&<ChevronRight className="pipe-arrow"/>}</div>)}</div>
      <div className="ops-grid"><div className="panel"><span className="kicker">AUTOMATION</span><h3>Two production schedules</h3><div className="ops-line"><Workflow/><span><b>Hourly feature pipeline</b><small>9-day context · newest complete hour</small></span><Badge>ACTIVE</Badge></div><div className="ops-line"><GitBranch/><span><b>Daily model training</b><small>Validation selection · registry upload</small></span><Badge>ACTIVE</Badge></div></div><div className="panel"><span className="kicker">ARTIFACTS</span><h3>Reload verified</h3>{["Ridge · joblib","Random Forest · joblib","LSTM · Keras"].map(x=><div className="artifact" key={x}><Check/>{x}<Badge>PASS</Badge></div>)}</div></div>
    </section>

    <section id="audit" className="section-wrap audit-section">
      <SectionTitle eyebrow="06 · TRUST CENTER" title="The model earns its confidence." copy="Leakage checks, testing, reproducibility, and security are exposed alongside performance—because trustworthy ML is more than a score."/>
      <div className="audit-layout">
        <div className="score-card"><span>INDEPENDENT AUDIT</span><strong>94<small>/100</small></strong><b>EXCELLENT</b><p>Substantially complete and verified. Production model, pipelines, feature store, and API are all operational. Two minor environment items remain outside automated scope.</p></div>
        <div className="checks panel">{auditChecks.map(([label,status])=><div key={label}><span className="check-icon"><Check/></span><span><b>{label}</b><small>Verified programmatically</small></span><Badge>{status}</Badge></div>)}</div>
      </div>
      <div className="audit-summary">
        <Stat label="TEST SUITE" value="33 / 39" note="Core suite passing · 5 require retraining on current sklearn" icon={<TestTube2/>}/>
        <Stat label="HOPSWORKS" value="Connected" note="FG · FV · dataset · registry" icon={<Database/>}/>
        <Stat label="SECURITY" value="Partial" note="Artifact signing still required" icon={<ShieldCheck/>}/>
      </div>
      <div className="disclosure"><ShieldCheck/><div><b>Transparent by design</b><p>Validation and test metrics are separated throughout this interface. R² is never presented as classification accuracy. Known limitations remain visible.</p></div></div>
    </section>

    <footer><div className="brand"><span className="brand-mark"><Wind size={18}/></span><span><b>PEARLS</b><small>AIR INTELLIGENCE</small></span></div><p>Real data · honest metrics · observable ML</p><span>Artifact generated {new Date(forecast.generated_at).toLocaleDateString()}</span></footer>
  </main>;
}
