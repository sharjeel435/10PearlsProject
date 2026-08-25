"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DashboardError]", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 4vw",
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.14em",
          color: "var(--text-faint)",
          textTransform: "uppercase",
          marginBottom: "16px",
        }}
      >
        Dashboard Error
      </p>

      <h2
        style={{
          fontSize: "clamp(22px, 4vw, 36px)",
          fontWeight: 800,
          letterSpacing: "-0.04em",
          color: "var(--text-primary)",
          marginBottom: "12px",
        }}
      >
        Dashboard failed to load
      </h2>

      <p
        style={{
          fontSize: "13px",
          color: "var(--text-muted)",
          maxWidth: "480px",
          lineHeight: 1.65,
          marginBottom: "32px",
        }}
      >
        The forecast data could not be rendered. This may happen if the data
        artifacts are being regenerated. Try refreshing, or go back to the
        homepage.
      </p>

      {error.digest && (
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-faint)",
            marginBottom: "24px",
            fontFamily: "monospace",
          }}
        >
          Error ref: {error.digest}
        </p>
      )}

      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <button
          onClick={reset}
          style={{
            padding: "10px 24px",
            background: "var(--accent)",
            color: "#04110d",
            border: "none",
            borderRadius: "8px",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
        <Link
          href="/"
          style={{
            padding: "10px 24px",
            border: "1px solid var(--border-medium)",
            color: "var(--text-muted)",
            borderRadius: "8px",
            fontWeight: 600,
            fontSize: "13px",
            display: "inline-flex",
            alignItems: "center",
            textDecoration: "none",
          }}
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
