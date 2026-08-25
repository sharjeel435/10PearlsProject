"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          background: "#060c0f",
          color: "#eef5f5",
          fontFamily: "system-ui, -apple-system, sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "40px",
          textAlign: "center",
          margin: 0,
        }}
      >
        <p
          style={{
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: "#384a4e",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}
        >
          Pearls Air Intelligence
        </p>

        <h1
          style={{
            fontSize: "clamp(28px, 5vw, 48px)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            marginBottom: "16px",
            lineHeight: 1.05,
          }}
        >
          Something went wrong
        </h1>

        <p
          style={{
            fontSize: "14px",
            color: "#576b70",
            maxWidth: "480px",
            lineHeight: 1.65,
            marginBottom: "32px",
          }}
        >
          An unexpected error occurred while rendering the dashboard. The error
          has been logged. Try refreshing — if the problem persists, the data
          pipeline may be regenerating artifacts.
        </p>

        {error.digest && (
          <p
            style={{
              fontSize: "11px",
              color: "#384a4e",
              marginBottom: "24px",
              fontFamily: "monospace",
            }}
          >
            Ref: {error.digest}
          </p>
        )}

        <button
          onClick={reset}
          style={{
            padding: "12px 28px",
            background: "#10b981",
            color: "#04110d",
            border: "none",
            borderRadius: "8px",
            fontWeight: 700,
            fontSize: "14px",
            cursor: "pointer",
            letterSpacing: "-0.01em",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
