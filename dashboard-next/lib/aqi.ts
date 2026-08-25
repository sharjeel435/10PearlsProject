import type { AQICategory } from "./types";

export function getAQICategory(value: number): AQICategory {
  if (value <= 50) return "Good";
  if (value <= 100) return "Moderate";
  if (value <= 150) return "Unhealthy for Sensitive Groups";
  if (value <= 200) return "Unhealthy";
  if (value <= 300) return "Very Unhealthy";
  return "Hazardous";
}

export const formatMetric = (value: number, digits = 3) =>
  Number.isFinite(value) ? value.toFixed(digits) : "Unavailable";

export function getCategoryTone(category: string): "good" | "moderate" | "sensitive" | "unhealthy" | "very-unhealthy" | "hazardous" {
  if (category.includes("Hazardous")) return "hazardous";
  if (category.includes("Very Unhealthy")) return "very-unhealthy";
  if (category.includes("Unhealthy for Sensitive")) return "sensitive";
  if (category.includes("Unhealthy")) return "unhealthy";
  if (category.includes("Moderate")) return "moderate";
  return "good";
}

export function getCategoryHex(category: string): string {
  const tone = getCategoryTone(category);
  switch (tone) {
    case "good": return "#10b981";
    case "moderate": return "#eab308";
    case "sensitive": return "#f97316";
    case "unhealthy": return "#ef4444";
    case "very-unhealthy": return "#a855f7";
    case "hazardous": return "#be123c";
  }
}

export function getCategoryGuidance(category: string): { summary: string; advice: string } {
  const tone = getCategoryTone(category);
  switch (tone) {
    case "good":
      return {
        summary: "Air quality is considered satisfactory, and air pollution poses little or no risk.",
        advice: "Ideal conditions for outdoor exercise and recreation for all groups.",
      };
    case "moderate":
      return {
        summary: "Air quality is acceptable; however, some pollutants may be a moderate health concern.",
        advice: "Unusually sensitive individuals should consider limiting prolonged outdoor exertion.",
      };
    case "sensitive":
      return {
        summary: "Members of sensitive groups may experience health effects. General public is less likely affected.",
        advice: "People with respiratory or heart disease, elderly, and children should reduce heavy outdoor exertion.",
      };
    case "unhealthy":
      return {
        summary: "Some members of the general public may experience health effects; sensitive groups experience more serious effects.",
        advice: "Everyone should reduce prolonged or heavy exertion outdoors. Consider wearing an N95 mask.",
      };
    case "very-unhealthy":
      return {
        summary: "Health alert: The risk of health effects is increased for everyone in the population.",
        advice: "Avoid outdoor activities. Keep windows closed and run indoor air filtration.",
      };
    case "hazardous":
      return {
        summary: "Health warning of emergency conditions: Everyone is more likely to be seriously affected.",
        advice: "Remain indoors with air filtration active. Avoid all outdoor physical activity.",
      };
  }
}

export function calculateTrend(startAQI: number, endAQI: number): {
  direction: "improving" | "worsening" | "stable";
  delta: number;
  label: string;
  description: string;
} {
  const delta = Math.round(endAQI - startAQI);
  if (Math.abs(delta) <= 3) {
    return {
      direction: "stable",
      delta,
      label: "→ Stable",
      description: "Minimal forecast movement over 72 hours",
    };
  }
  if (delta > 0) {
    return {
      direction: "worsening",
      delta,
      label: "↑ Worsening",
      description: `AQI +${delta} over next 72 hours`,
    };
  }
  return {
    direction: "improving",
    delta,
    label: "↓ Improving",
    description: `AQI ${delta} over next 72 hours`,
  };
}

export function formatFeatureName(raw: string): string {
  if (!raw) return "";
  let name = String(raw).replace(/^numeric__/, "").replace(/^city__city_/, "City: ");
  name = name
    .replaceAll("_", " ")
    .replace(/rolling max (\d+h)/, "rolling max · $1")
    .replace(/rolling mean (\d+h)/, "rolling mean · $1")
    .replace(/rolling min (\d+h)/, "rolling min · $1")
    .replace(/rolling std (\d+h)/, "rolling std · $1")
    .replace(/lag (\d+h)/, "lag · $1")
    .replace(/change (\d+h)/, "change · $1")
    .replace(/pct change (\d+h)/, "% change · $1");
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/** Short label for compact UI, e.g. badge displays */
export function getCategoryShortLabel(category: string): string {
  if (category.includes("Hazardous")) return "Hazardous";
  if (category.includes("Very Unhealthy")) return "Very Unhealthy";
  if (category.includes("Sensitive")) return "Sensitive Groups";
  if (category.includes("Unhealthy")) return "Unhealthy";
  if (category.includes("Moderate")) return "Moderate";
  return "Good";
}

export function getCardinalDirection(deg: number | null): string {
  if (deg === null || !Number.isFinite(deg)) return "—";
  const directions = [
    "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"
  ];
  const normalized = ((deg % 360) + 360) % 360;
  const index = Math.round(normalized / 22.5) % 16;
  return directions[index];
}
