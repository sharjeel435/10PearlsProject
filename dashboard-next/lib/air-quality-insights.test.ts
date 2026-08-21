import { describe, expect, it } from "vitest";
import {
  calculateCigaretteEquivalent,
  calculateCigaretteEquivalentFromHourly,
  calculateCityInsights,
  calculateCityHorizonInsights,
  calculateStagnationIndex,
  findBestOutdoorWindow,
  summarizeCigaretteEquivalent,
} from "./air-quality-insights";

const at = (hour: number) => `2026-08-21T${String(hour).padStart(2, "0")}:00:00Z`;

describe("cigarette equivalent", () => {
  it("uses the Berkeley Earth divisor and rounds to one decimal", () => {
    expect(calculateCigaretteEquivalent(22)).toBe(1);
    expect(calculateCigaretteEquivalent(33)).toBe(1.5);
    expect(calculateCigaretteEquivalent(0)).toBe(0);
    expect(calculateCigaretteEquivalent(-2)).toBe(0);
  });

  it("skips missing and invalid hourly values", () => {
    const result = calculateCigaretteEquivalentFromHourly([22, null, undefined, -1, 44]);
    expect(result).toMatchObject({ pm25Average: 33, validHours: 2, cigarettes: 1.5 });
    expect(calculateCigaretteEquivalentFromHourly([null]).summary).toBe("PM2.5 data unavailable");
  });

  it("handles every message threshold", () => {
    expect(summarizeCigaretteEquivalent(0)).toBe("Negligible exposure today");
    expect(summarizeCigaretteEquivalent(0.1)).toContain("Equivalent");
    expect(summarizeCigaretteEquivalent(1)).not.toContain("⚠️");
    expect(summarizeCigaretteEquivalent(1.1)).toContain("⚠️");
    expect(summarizeCigaretteEquivalent(5)).toContain("⚠️");
    expect(summarizeCigaretteEquivalent(5.1)).toContain("🚨");
  });
});

describe("stagnation index", () => {
  it("returns the weighted worst and best boundaries", () => {
    expect(calculateStagnationIndex(0, 100, 1030, 0)).toMatchObject({ score: 100 });
    expect(calculateStagnationIndex(30, 2000, 1000, 0)).toMatchObject({ score: 0 });
  });

  it("clamps out-of-range inputs and applies the pressure trend", () => {
    const low = calculateStagnationIndex(100, 5000, 990, -20);
    expect(low.breakdown).toEqual({ wind: 0, blh: 0, pressure: 0 });
    const rising = calculateStagnationIndex(15, 1050, 1010, 10);
    const falling = calculateStagnationIndex(15, 1050, 1010, -10);
    expect(rising.score).toBeGreaterThan(falling.score);
  });

  it("uses inclusive score-band boundaries", () => {
    expect(calculateStagnationIndex(30, 2000, 1060, 0).score).toBe(15);
    expect(calculateStagnationIndex(0, 2000, 1030, 0).score).toBe(60);
    expect(calculateStagnationIndex(0, 100, 1000, 0).score).toBe(85);
  });
});

describe("best outdoor window", () => {
  it("finds extrema and the longest consecutive safe block", () => {
    const result = findBestOutdoorWindow([
      { time: at(5), aqi: 50 }, { time: at(6), aqi: 40 }, { time: at(7), aqi: 55 },
      { time: at(8), aqi: 120 }, { time: at(9), aqi: 80 }, { time: at(10), aqi: 90 },
    ]);
    expect(result.bestHour).toEqual({ time: at(6), aqi: 40 });
    expect(result.worstHour).toEqual({ time: at(8), aqi: 120 });
    expect(result.safeWindow).toEqual({ start: at(5), end: at(7), avgAqi: 48 });
  });

  it("excludes night by default, restores it when all daytime hours are bad", () => {
    expect(findBestOutdoorWindow([
      { time: at(1), aqi: 10 }, { time: at(6), aqi: 40 }, { time: at(7), aqi: 50 },
    ]).bestHour?.time).toBe(at(6));
    expect(findBestOutdoorWindow([
      { time: at(1), aqi: 90 }, { time: at(6), aqi: 150 }, { time: at(7), aqi: 160 },
    ]).bestHour?.time).toBe(at(1));
  });

  it("rejects threshold equality and invalid values", () => {
    const result = findBestOutdoorWindow([
      { time: at(6), aqi: 100 }, { time: at(7), aqi: 99 }, { time: at(8), aqi: null },
    ]);
    expect(result.safeWindow).toBeNull();
    expect(findBestOutdoorWindow([]).bestHour).toBeNull();
  });
});

describe("combined city/horizon result", () => {
  it("returns synchronous hourly stagnation values with all feature groups", () => {
    const air = Array.from({ length: 24 }, (_, hour) => ({ time: at(hour), aqi: 50 + hour, pm25: 22 }));
    const weather = Array.from({ length: 24 }, (_, hour) => ({
      time: at(hour), windSpeed: 15, boundaryLayerHeight: 1050, surfacePressure: 1015,
    }));
    const result = calculateCityHorizonInsights("Karachi", 24, air, weather);
    expect(result).toMatchObject({ city: "Karachi", horizon: "24h" });
    expect(result.cigaretteEquivalent.cigarettes).toBe(1);
    expect(result.stagnationIndex).toHaveLength(24);
    expect(result.bestOutdoorWindow.bestHour).not.toBeNull();
  });

  it("builds the standard three forecast horizons per city", () => {
    const air = Array.from({ length: 72 }, (_, hour) => ({
      time: new Date(Date.UTC(2026, 7, 21, hour)).toISOString(), aqi: 50, pm25: 22,
    }));
    const weather = air.map(({ time }) => ({
      time, windSpeed: 15, boundaryLayerHeight: 1050, surfacePressure: 1015,
    }));
    const results = calculateCityInsights("Lahore", air, weather);
    expect(results.map(({ horizon }) => horizon)).toEqual(["24h", "48h", "72h"]);
    expect(results.map(({ stagnationIndex }) => stagnationIndex.length)).toEqual([24, 48, 72]);
  });
});
