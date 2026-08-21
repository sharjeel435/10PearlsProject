import { describe, expect, it } from "vitest";
import { parseWeatherOutlook, weatherLabel } from "./openmeteo";

describe("Open-Meteo weather outlook", () => {
  it("maps three daily API records into the UI contract", () => {
    const result = parseWeatherOutlook("Karachi", {
      timezone: "Asia/Karachi",
      daily: {
        time: ["2026-08-21", "2026-08-22", "2026-08-23"],
        weather_code: [1, 61, 95],
        temperature_2m_max: [32, 31, 30],
        temperature_2m_min: [27, 26, 25],
        precipitation_sum: [0, 4.2, 12],
        wind_speed_10m_max: [18, 22, 16],
      },
    });
    expect(result?.days).toHaveLength(3);
    expect(result?.days[1].precipitation).toBe(4.2);
    expect(result?.timezone).toBe("Asia/Karachi");
  });

  it("rejects malformed responses and explains WMO weather codes", () => {
    expect(parseWeatherOutlook("Lahore", {})).toBeNull();
    expect(weatherLabel(0)).toBe("Clear");
    expect(weatherLabel(61)).toBe("Rain");
    expect(weatherLabel(95)).toBe("Thunderstorms");
  });
});
