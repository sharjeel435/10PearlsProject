import SiteHeader from "@/components/SiteHeader";
import "./atmospheric-intelligence.css";
export default function Loading() { return <main><SiteHeader/><div className="ai-shell ai-loading"><p className="eyebrow">Open-Meteo atmospheric forecast</p><div className="ai-skeleton ai-skeleton-title"/><div className="ai-skeleton ai-skeleton-hero"/><div className="ai-skeleton ai-skeleton-chart"/><p>Assembling atmospheric intelligence…</p></div></main>; }

