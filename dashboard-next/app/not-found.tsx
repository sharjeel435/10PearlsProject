import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
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
          background: "rgba(6, 182, 212, 0.1)",
          color: "var(--brand-cyan)",
          display: "grid",
          placeItems: "center",
          marginBottom: "20px",
        }}
      >
        <Compass size={28} />
      </div>

      <span className="eyebrow-tag" style={{ marginBottom: "8px" }}>
        404 ERROR
      </span>

      <h1 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, color: "var(--text-primary)", marginBottom: "12px" }}>
        This Airspace Is Uncharted
      </h1>

      <p style={{ fontSize: "15px", color: "var(--text-secondary)", maxWidth: "440px", lineHeight: 1.6, marginBottom: "28px" }}>
        The requested environmental page or coordinates could not be located in the system registry.
      </p>

      <Link href="/" className="btn-primary" style={{ gap: "10px" }}>
        <ArrowLeft size={16} /> Return to Home
      </Link>
    </main>
  );
}
