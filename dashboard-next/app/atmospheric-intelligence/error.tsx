"use client";
import SiteHeader from "@/components/SiteHeader";
export default function Error({ reset }: { reset: () => void }) { return <main><SiteHeader/><div className="ai-shell ai-error"><p className="eyebrow">Atmospheric Intelligence</p><h1>Atmospheric data temporarily unavailable.</h1><p>Open-Meteo could not be reached. The existing AQI prediction system is unaffected.</p><button className="btn-primary" onClick={reset}>Retry</button></div></main>; }

