"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "var(--radius-md)",
          background: "rgba(239, 68, 68, 0.1)",
          color: "var(--aqi-unhealthy)",
          display: "grid",
          placeItems: "center",
          marginBottom: "20px",
        }}
      >
        <AlertTriangle size={28} />
      </div>

      <span className="eyebrow-tag" style={{ color: "var(--aqi-unhealthy)", marginBottom: "8px" }}>
        SYSTEM STATE
      </span>

      <h1 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, color: "var(--text-primary)", marginBottom: "12px" }}>
        Forecast Temporarily Unavailable
      </h1>

      <p style={{ fontSize: "15px", color: "var(--text-secondary)", maxWidth: "480px", lineHeight: 1.6, marginBottom: "28px" }}>
        The interface could not load a verified forecast artifact from the repository. In accordance with our scientific transparency policy, no synthetic placeholder measurements are shown.
      </p>

      <button onClick={reset} className="btn-primary" style={{ gap: "10px" }}>
        <RefreshCw size={16} /> Try Again
      </button>
    </main>
  );
}
