import type { AtmosphericHour, DispersionLevel, DriverInsight, PollutantReading, WindowResult } from "./types";

const valid = (v: number | null | undefined): v is number => typeof v === "number" && Number.isFinite(v);
const avg = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;

export function getDominantPollutant(items: PollutantReading[]): PollutantReading | null {
  return items.filter(p => valid(p.aqi)).sort((a, b) => (b.aqi as number) - (a.aqi as number))[0] ?? null;
}
export function sortPollutants(items: PollutantReading[]) {
  return [...items].sort((a, b) => valid(b.aqi) && valid(a.aqi) ? b.aqi - a.aqi : valid(b.aqi) ? 1 : valid(a.aqi) ? -1 : 0);
}
export function selectHours(hours: AtmosphericHour[], range: 24 | 48 | 72) { return hours.slice(0, range); }

function windowResult(hours: AtmosphericHour[]): WindowResult | null {
  const values = hours.map(h => h.aqi).filter(valid);
  if (values.length !== hours.length || !values.length) return null;
  return { hours, min: Math.round(Math.min(...values)), max: Math.round(Math.max(...values)), average: avg(values) };
}
function findWindow(hours: AtmosphericHour[], mode: "best" | "worst"): WindowResult | null {
  let chosen: WindowResult | null = null;
  const size = hours.length >= 3 ? 3 : 2;
  for (let i = 0; i <= hours.length - size; i++) {
    const candidate = windowResult(hours.slice(i, i + size));
    if (!candidate) continue;
    if (!chosen || (mode === "best" ? candidate.average < chosen.average : candidate.average > chosen.average)) chosen = candidate;
  }
  return chosen;
}
export const findBestWindow = (hours: AtmosphericHour[]) => findWindow(hours, "best");
export const findWorstWindow = (hours: AtmosphericHour[]) => findWindow(hours, "worst");

export function findFastestChange(hours: AtmosphericHour[], mode: "improvement" | "deterioration") {
  let result: { start: AtmosphericHour; end: AtmosphericHour; delta: number } | null = null;
  for (const span of [5, 4, 3, 2]) for (let i = 0; i + span < hours.length; i++) {
    const start = hours[i], end = hours[i + span];
    if (!valid(start.aqi) || !valid(end.aqi)) continue;
    const delta = Math.round(end.aqi - start.aqi);
    if ((mode === "improvement" && delta >= 0) || (mode === "deterioration" && delta <= 0)) continue;
    if (!result || (mode === "improvement" ? delta < result.delta : delta > result.delta)) result = { start, end, delta };
  }
  return result;
}

/** App-derived rules: rain >=0.5mm elevates dispersion; otherwise wind <3 very weak, <7 weak, <13 moderate, <20 good, >=20 strong. */
export function getDispersion(hour: AtmosphericHour): DispersionLevel {
  const wind = hour.windSpeed ?? 0, rain = Math.max(hour.rain ?? 0, hour.precipitation ?? 0);
  if (rain >= 0.5) return wind >= 20 ? "STRONG" : "GOOD";
  if (wind < 3) return "VERY WEAK";
  if (wind < 7) return "WEAK";
  if (wind < 13) return "MODERATE";
  if (wind < 20) return "GOOD";
  return "STRONG";
}

export function analyzeDrivers(hours: AtmosphericHour[]): DriverInsight[] {
  const now = hours[0]; if (!now) return [];
  const next = hours.slice(1, 13); const insights: DriverInsight[] = [];
  const pm = now.pollutants.pm2_5?.concentration;
  if ((now.windSpeed ?? 99) < 7 && (valid(pm) ? pm > 35 : (now.aqi ?? 0) > 100)) insights.push({ id: "weak-dispersion", title: "Weak pollution dispersion", explanation: "Low wind speeds coincide with elevated particle pollution. Conditions currently favour pollutant accumulation near the surface.", tone: "warning" });
  if (next.some(h => (h.windSpeed ?? 0) >= Math.max(12, (now.windSpeed ?? 0) + 6))) insights.push({ id: "wind", title: "Winds strengthening", explanation: "Dispersion conditions may improve as forecast winds strengthen during the coming hours.", tone: "positive" });
  if (next.some(h => Math.max(h.rain ?? 0, h.precipitation ?? 0) >= 0.5)) insights.push({ id: "rain", title: "Rain approaching", explanation: "Forecast rainfall may help remove suspended particulate matter from the atmosphere.", tone: "positive" });
  if ((now.humidity ?? 0) >= 75 && valid(pm) && pm >= 35) insights.push({ id: "humidity", title: "Humid, particle-rich air", explanation: "High humidity coincides with elevated fine particles and may contribute to hazier conditions.", tone: "neutral" });
  if ((now.pollutants.dust?.concentration ?? 0) >= 50) insights.push({ id: "dust", title: "Elevated atmospheric dust", explanation: "Open-Meteo indicates elevated atmospheric dust during this period, which may add to particulate loading.", tone: "warning" });
  if ((now.pollutants.aerosol_optical_depth?.concentration ?? 0) >= 0.4) insights.push({ id: "haze", title: "Haze signal elevated", explanation: "Elevated aerosol optical depth suggests increased atmospheric haze in the forecast model.", tone: "warning" });
  return insights.length ? insights.slice(0, 5) : [{ id: "steady", title: "No strong driver signal", explanation: "Current Open-Meteo variables do not indicate a single strong atmospheric driver. Several conditions may be interacting.", tone: "neutral" }];
}

export type ActivityAdvice = { status: string; note: string; tone: "good" | "caution" | "avoid" | "neutral" };
export function getActivityPlan(hour: AtmosphericHour) {
  const unavailable: ActivityAdvice = { status: "UNAVAILABLE", note: "AQI forecast data is unavailable for this hour.", tone: "neutral" };
  if (!valid(hour.aqi)) return { exercise: unavailable, commute: unavailable, school: unavailable, ventilation: unavailable };
  const aqi = hour.aqi, wet = Math.max(hour.rain ?? 0, hour.precipitation ?? 0) >= 0.5, hot = (hour.temperature ?? 0) >= 38;
  const exercise: ActivityAdvice = aqi <= 50 && !wet && !hot ? { status: "IDEAL", note: "Conditions favour outdoor exercise for most people.", tone: "good" } : aqi <= 100 ? { status: "CAUTION", note: wet ? "Air is acceptable, but forecast rain may affect outdoor plans." : hot ? "Air is acceptable, but heat may increase exertion risk." : "Sensitive people may prefer a lighter or shorter session.", tone: "caution" } : aqi <= 150 ? { status: "LIMIT", note: "Sensitive groups should reduce prolonged outdoor exertion.", tone: "caution" } : { status: "AVOID", note: "Move strenuous exercise indoors while pollution remains elevated.", tone: "avoid" };
  const commute: ActivityAdvice = aqi <= 100 ? { status: wet ? "PLAN AHEAD" : "FAVOURABLE", note: wet ? "Air conditions are acceptable, but allow for forecast rain." : "Air conditions are suitable for a normal commute for most people.", tone: wet ? "caution" : "good" } : { status: aqi > 150 ? "MINIMIZE" : "CAUTION", note: "Reduce time near heavy traffic and consider a lower-exposure route.", tone: aqi > 150 ? "avoid" : "caution" };
  const school: ActivityAdvice = aqi <= 100 ? { status: "OUTDOORS", note: "Outdoor activities are reasonable; monitor unusually sensitive children.", tone: "good" } : aqi <= 150 ? { status: "MODIFY", note: "Shorten strenuous outdoor activities for sensitive children.", tone: "caution" } : { status: "INDOORS", note: "Consider moving strenuous school activities indoors.", tone: "avoid" };
  const ventilation: ActivityAdvice = aqi <= 50 && !wet ? { status: "GOOD TIME", note: "Outdoor air conditions favour a short ventilation period.", tone: "good" } : aqi <= 100 ? { status: "BRIEF", note: wet ? "Rain is forecast; ventilate only if practical." : "A brief ventilation period may be reasonable.", tone: "caution" } : { status: "KEEP CLOSED", note: "Limit outdoor-air intake while forecast pollution is elevated.", tone: "avoid" };
  return { exercise, commute, school, ventilation };
}
