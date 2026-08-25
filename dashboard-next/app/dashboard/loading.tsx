export default function DashboardLoading() {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        color: "var(--text-faint)",
      }}
    >
      {/* Animated pulsing dots */}
      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--accent)",
              display: "inline-block",
              animation: `loading-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
      <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
        Loading forecast data
      </p>

      <style>{`
        @keyframes loading-pulse {
          0%, 80%, 100% { opacity: 0.15; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
