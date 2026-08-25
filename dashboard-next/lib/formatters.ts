/**
 * Centralized formatting utilities for the Pearls AQI platform.
 * All date/time/AQI formatting should go through here.
 * PKT = UTC+5 (Pakistan Standard Time, no DST).
 */


/** Convert an ISO timestamp to a human-readable PKT string, e.g. "Aug 24, 11:00 AM PKT" */
export function toPKT(ts: string | null | undefined): string {
  if (!ts) return "—";
  const d = new Date(ts);
  if (!Number.isFinite(d.getTime())) return "—";
  return (
    d.toLocaleString("en-US", {
      timeZone: "Asia/Karachi",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }) + " PKT"
  );
}

/** Short PKT — just time, e.g. "11:00 PKT" */
export function toPKTTime(ts: string | null | undefined): string {
  if (!ts) return "—";
  const d = new Date(ts);
  if (!Number.isFinite(d.getTime())) return "—";
  return (
    d.toLocaleString("en-US", {
      timeZone: "Asia/Karachi",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }) + " PKT"
  );
}

/** Full UTC string for secondary display, e.g. "Aug 24, 2026, 06:00 UTC" */
export function toUTC(ts: string | null | undefined): string {
  if (!ts) return "—";
  const d = new Date(ts);
  if (!Number.isFinite(d.getTime())) return "—";
  return (
    d.toLocaleString("en-US", {
      timeZone: "UTC",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }) + " UTC"
  );
}

/** PKT date only, e.g. "Aug 24" */
export function toPKTDate(ts: string | null | undefined): string {
  if (!ts) return "—";
  const d = new Date(ts);
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    timeZone: "Asia/Karachi",
    month: "short",
    day: "numeric",
  });
}

/** Relative time string — "just now", "12 min ago", "3 hours ago", "14 days ago" */
export function toRelative(ts: string | null | undefined, from?: Date): string {
  if (!ts) return "—";
  const d = new Date(ts);
  if (!Number.isFinite(d.getTime())) return "—";
  const now = from ?? new Date();
  const diffMs = now.getTime() - d.getTime();

  if (diffMs < 0) return "just now"; // future timestamp
  if (diffMs < 60_000) return "just now";
  if (diffMs < 3_600_000) {
    const mins = Math.round(diffMs / 60_000);
    return `${mins} min ago`;
  }
  if (diffMs < 86_400_000) {
    const hrs = Math.round(diffMs / 3_600_000);
    return `${hrs} hour${hrs !== 1 ? "s" : ""} ago`;
  }
  const days = Math.round(diffMs / 86_400_000);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

export type FreshnessState = "live" | "recent" | "stale" | "very-stale" | "unavailable";

/**
 * Returns a freshness state based on how old a timestamp is.
 * live     = < 3 hours
 * recent   = 3–12 hours
 * stale    = 12–72 hours
 * very-stale = > 72 hours
 * unavailable = null/invalid
 */
export function getObservationFreshness(
  ts: string | null | undefined,
  from?: Date
): FreshnessState {
  if (!ts) return "unavailable";
  const d = new Date(ts);
  if (!Number.isFinite(d.getTime())) return "unavailable";
  const now = from ?? new Date();
  const diffHours = (now.getTime() - d.getTime()) / 3_600_000;

  if (diffHours < 0) return "live"; // future (e.g. next.js SSR with stale clock)
  if (diffHours < 3) return "live";
  if (diffHours < 12) return "recent";
  if (diffHours < 72) return "stale";
  return "very-stale";
}

export function freshnessColor(state: FreshnessState): string {
  switch (state) {
    case "live":       return "var(--aqi-good)";
    case "recent":     return "var(--aqi-good)";
    case "stale":      return "var(--aqi-moderate)";
    case "very-stale": return "var(--aqi-unhealthy)";
    case "unavailable":return "var(--text-faint)";
  }
}

export function freshnessLabel(state: FreshnessState): string {
  switch (state) {
    case "live":       return "Live";
    case "recent":     return "Recent";
    case "stale":      return "Stale";
    case "very-stale": return "Very Stale";
    case "unavailable":return "Unavailable";
  }
}

/** Format AQI as a rounded integer string */
export function formatAQI(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return String(Math.round(value));
}

/** Format a metric with fixed decimal places, or "Unavailable" */
export function formatMetricSafe(
  value: number | null | undefined,
  digits = 2,
  fallback = "—"
): string {
  if (value == null || !Number.isFinite(Number(value))) return fallback;
  return Number(value).toFixed(digits);
}
