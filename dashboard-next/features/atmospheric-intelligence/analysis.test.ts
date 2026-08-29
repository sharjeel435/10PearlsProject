import { describe, expect, it } from "vitest";
import {
  analyzeDrivers,
  findBestWindow,
  findFastestChange,
  findWorstWindow,
  getDominantPollutant,
  getDispersion,
  getActivityPlan,
  selectHours,
  sortPollutants,
} from "./analysis";
import type { AtmosphericHour, PollutantReading } from "./types";

const hour = (time: string, aqi: number | null, extra: Partial<AtmosphericHour> = {}): AtmosphericHour => ({
  time, aqi, temperature: 25, humidity: 55, precipitation: 0, rain: 0,
  pressure: 1012, visibility: 12000, cloudCover: 10, windSpeed: 8,
  windDirection: 45, windGusts: 14, isDay: true, pollutants: {}, ...extra,
});

const pollutant = (key: PollutantReading["key"], aqi: number | null, concentration = 10): PollutantReading => ({
  key, label: key, concentration, unit: "µg/m³", aqi,
});

describe("atmospheric intelligence analysis", () => {
  it("selects the dominant pollutant by pollutant-specific AQI, including zero", () => {
    expect(getDominantPollutant([pollutant("pm2_5", 80), pollutant("ozone", 120)])?.key).toBe("ozone");
    expect(getDominantPollutant([pollutant("pm2_5", 0)])?.aqi).toBe(0);
    expect(getDominantPollutant([pollutant("pm2_5", null)])).toBeNull();
  });

  it("sorts valid pollutant AQIs ahead of missing values", () => {
    expect(sortPollutants([pollutant("pm10", null), pollutant("ozone", 20), pollutant("pm2_5", 90)]).map(p => p.key))
      .toEqual(["pm2_5", "ozone", "pm10"]);
  });

  it("prefers a sustained low 2-4 hour window and finds the sustained high window", () => {
    const hours = [150, 90, 40, 42, 45, 100, 170, 180, 175, 80].map((v, i) => hour(`2026-08-30T${String(i).padStart(2, "0")}:00`, v));
    const best = findBestWindow(hours);
    const worst = findWorstWindow(hours);
    expect(best && [2, 3, 4].includes(best.hours.length)).toBe(true);
    expect(best?.hours.map(h => h.aqi)).toEqual([40, 42, 45]);
    expect(worst?.hours.map(h => h.aqi)).toEqual([170, 180, 175]);
  });

  it("finds fastest sustained improvement and deterioration", () => {
    const hours = [150, 140, 120, 90, 95, 110, 145].map((v, i) => hour(`2026-08-30T${String(i).padStart(2, "0")}:00`, v));
    expect(findFastestChange(hours, "improvement")?.delta).toBe(-60);
    expect(findFastestChange(hours, "deterioration")?.delta).toBe(55);
  });

  it("handles missing AQI and exact 24/48/72 hour selection", () => {
    const hours = Array.from({ length: 80 }, (_, i) => hour(`2026-08-${String(29 + Math.floor(i / 24)).padStart(2, "0")}T${String(i % 24).padStart(2, "0")}:00`, i === 0 ? null : i));
    expect(findBestWindow([hour("2026-08-30T00:00", null)])).toBeNull();
    expect(selectHours(hours, 24)).toHaveLength(24);
    expect(selectHours(hours, 48)).toHaveLength(48);
    expect(selectHours(hours, 72)).toHaveLength(72);
  });

  it("keeps local timestamps intact across a date/timezone boundary", () => {
    const hours = [hour("2026-08-30T23:00", 190), hour("2026-08-31T00:00", 60), hour("2026-08-31T01:00", 50), hour("2026-08-31T02:00", 55)];
    expect(findBestWindow(hours)?.hours[0].time).toBe("2026-08-31T00:00");
  });

  it("classifies transparent dispersion and cautious driver rules", () => {
    expect(getDispersion(hour("2026-08-30T00:00", 130, { windSpeed: 2 }))).toBe("VERY WEAK");
    expect(getDispersion(hour("2026-08-30T00:00", 80, { windSpeed: 20 }))).toBe("STRONG");
    expect(getDispersion(hour("2026-08-30T00:00", 80, { windSpeed: 4, precipitation: 1 }))).toBe("GOOD");
    const drivers = analyzeDrivers([
      hour("2026-08-30T00:00", 150, { windSpeed: 3, humidity: 82, pollutants: { pm2_5: pollutant("pm2_5", 150, 65), dust: pollutant("dust", null, 70) } }),
      hour("2026-08-30T01:00", 120, { windSpeed: 15, rain: 1 }),
    ]);
    expect(drivers.some(d => d.id === "weak-dispersion")).toBe(true);
    expect(drivers.some(d => d.id === "rain")).toBe(true);
    expect(drivers.some(d => d.id === "dust")).toBe(true);
  });

  it("turns AQI and weather into cautious activity guidance", () => {
    const good = getActivityPlan(hour("2026-08-30T06:00", 42, { rain: 0, temperature: 27 }));
    expect(good.exercise.status).toBe("IDEAL");
    expect(good.ventilation.status).toBe("GOOD TIME");
    const unhealthy = getActivityPlan(hour("2026-08-30T14:00", 175, { rain: 0, temperature: 39 }));
    expect(unhealthy.exercise.status).toBe("AVOID");
    expect(unhealthy.school.status).toBe("INDOORS");
    const wet = getActivityPlan(hour("2026-08-30T18:00", 55, { rain: 2 }));
    expect(wet.commute.note).toContain("rain");
    expect(getActivityPlan(hour("2026-08-30T18:00", null)).exercise.status).toBe("UNAVAILABLE");
  });
});
