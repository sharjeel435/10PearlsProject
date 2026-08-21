export type CigaretteEquivalent = {
  cigarettes: number;
  pm25Average: number | null;
  validHours: number;
  summary: string;
};

export type StagnationIndex = {
  score: number;
  label: string;
  breakdown: { wind: number; blh: number; pressure: number };
};

export type HourlyAirQuality = {
  time: string;
  aqi: number | null;
  pm25?: number | null;
};

export type HourlyWeather = {
  time: string;
  windSpeed: number | null;
  boundaryLayerHeight: number | null;
  surfacePressure: number | null;
};

export type OutdoorWindow = {
  bestHour: { time: string; aqi: number } | null;
  worstHour: { time: string; aqi: number } | null;
  safeWindow: { start: string; end: string; avgAqi: number } | null;
  summary: string;
};

export type CityHorizonInsights = {
  city: string;
  horizon: `${number}h`;
  cigaretteEquivalent: CigaretteEquivalent;
  stagnationIndex: Array<{ time: string } & StagnationIndex>;
  bestOutdoorWindow: OutdoorWindow;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const round1 = (value: number) => Math.round((value + Number.EPSILON) * 10) / 10;
const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

/**
 * Berkeley Earth's rule of thumb equates 22 µg/m³ of 24-hour mean PM2.5
 * exposure to roughly one cigarette per day. Negative and non-finite inputs
 * are invalid rather than being interpreted as clean air.
 */
export function calculateCigaretteEquivalent(pm25_24hr_avg: number): number {
  if (!isFiniteNumber(pm25_24hr_avg) || pm25_24hr_avg < 0) return 0;
  return round1(pm25_24hr_avg / 22);
}

export function summarizeCigaretteEquivalent(cigarettes: number): string {
  if (cigarettes < 0.1) return "Negligible exposure today";
  if (cigarettes <= 1) return `Equivalent to smoking ${cigarettes.toFixed(1)} cigarettes today`;
  if (cigarettes <= 5) return `⚠️ Equivalent to smoking ${cigarettes.toFixed(1)} cigarettes today`;
  return `🚨 Severe: Equivalent to smoking ${cigarettes.toFixed(1)} cigarettes today`;
}

/** Average the most recent 24 valid hourly PM2.5 readings, skipping nulls. */
export function calculateCigaretteEquivalentFromHourly(
  values: ReadonlyArray<number | null | undefined>,
): CigaretteEquivalent {
  const valid = values.slice(-24).filter((value): value is number =>
    isFiniteNumber(value) && value >= 0
  );
  const average = valid.length
    ? valid.reduce((sum, value) => sum + value, 0) / valid.length
    : null;
  const cigarettes = average === null ? 0 : calculateCigaretteEquivalent(average);
  return {
    cigarettes,
    pm25Average: average === null ? null : round1(average),
    validHours: valid.length,
    summary: average === null ? "PM2.5 data unavailable" : summarizeCigaretteEquivalent(cigarettes),
  };
}

/**
 * Rule-based atmospheric stagnation score. Wind is supplied in km/h. Wind
 * (0–30 km/h) and boundary-layer height (100–2,000 m) are inverse-scaled.
 * Pressure is scaled from 1,000–1,030 hPa after applying the rolling 24-hour
 * pressure change, so rising pressure increases risk and falling pressure
 * decreases it. Components are clamped to [0, 1] before 45/40/15 weighting.
 */
export function calculateStagnationIndex(
  windSpeed: number,
  boundaryLayerHeight: number,
  surfacePressure: number,
  pressureTrend24h: number,
): StagnationIndex {
  const wind = clamp01(1 - Math.max(0, windSpeed) / 30);
  const blh = clamp01(1 - (Math.max(0, boundaryLayerHeight) - 100) / 1900);
  const effectivePressure = surfacePressure + pressureTrend24h;
  const pressure = clamp01((effectivePressure - 1000) / 30);
  const score = Math.round((wind * 0.45 + blh * 0.4 + pressure * 0.15) * 100);
  const label = score <= 30
    ? "Low — good pollutant dispersion"
    : score <= 60
      ? "Moderate — some pollutant buildup possible"
      : score <= 85
        ? "High — poor air circulation expected"
        : "Severe — atmospheric stagnation, pollution likely to trap near ground";
  return {
    score,
    label,
    breakdown: { wind: round1(wind), blh: round1(blh), pressure: round1(pressure) },
  };
}

const hourOf = (time: string) => {
  const match = time.match(/T(\d{2}):/);
  return match ? Number(match[1]) : Number.NaN;
};
const isNight = (time: string) => {
  const hour = hourOf(time);
  return Number.isFinite(hour) && (hour >= 23 || hour < 5);
};
const formatHour = (time: string) => {
  const hour = hourOf(time);
  if (!Number.isFinite(hour)) return time;
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
};

/**
 * Select useful outdoor periods from hourly AQI values. By default, 11 PM–
 * 4:59 AM is excluded. If every daytime hour is at/above the safe threshold,
 * night hours are restored so the caller still receives the least-bad option.
 * Safe blocks require at least two consecutive hourly timestamps.
 */
export function findBestOutdoorWindow(
  hourlyForecast: ReadonlyArray<{ time: string; aqi: number | null }>,
  options: { excludeNightHours?: boolean; safeAqiThreshold?: number } = {},
): OutdoorWindow {
  const threshold = isFiniteNumber(options.safeAqiThreshold) ? options.safeAqiThreshold : 100;
  const valid = hourlyForecast.filter((point): point is { time: string; aqi: number } =>
    typeof point.time === "string" && !Number.isNaN(Date.parse(point.time)) &&
    isFiniteNumber(point.aqi) && point.aqi >= 0
  );
  let candidates = options.excludeNightHours === false ? valid : valid.filter((point) => !isNight(point.time));
  if (!candidates.length || candidates.every((point) => point.aqi >= threshold)) candidates = valid;

  const bestHour = candidates.reduce<{ time: string; aqi: number } | null>(
    (best, point) => best === null || point.aqi < best.aqi ? point : best, null,
  );
  const worstHour = candidates.reduce<{ time: string; aqi: number } | null>(
    (worst, point) => worst === null || point.aqi > worst.aqi ? point : worst, null,
  );

  let longest: Array<{ time: string; aqi: number }> = [];
  let current: Array<{ time: string; aqi: number }> = [];
  for (const point of candidates) {
    const previous = current.at(-1);
    const consecutive = previous && Date.parse(point.time) - Date.parse(previous.time) === 3_600_000;
    if (point.aqi < threshold) current = !previous || consecutive ? [...current, point] : [point];
    else current = [];
    if (current.length > longest.length) longest = current;
  }
  const safeWindow = longest.length >= 2 ? {
    start: longest[0].time,
    end: longest.at(-1)!.time,
    avgAqi: Math.round(longest.reduce((sum, point) => sum + point.aqi, 0) / longest.length),
  } : null;
  const summary = bestHour && worstHour
    ? `Best time to go outside: ${formatHour(bestHour.time)} (AQI ${Math.round(bestHour.aqi)}). ` +
      `Avoid ${formatHour(worstHour.time)} (AQI ${Math.round(worstHour.aqi)}). ` +
      (safeWindow
        ? `Safe window: ${formatHour(safeWindow.start)}–${formatHour(safeWindow.end)} (avg AQI ${safeWindow.avgAqi}).`
        : `No 2+ hour window below AQI ${threshold}.`)
    : "Hourly AQI forecast unavailable.";
  return { bestHour, worstHour, safeWindow, summary };
}

/**
 * Compose all three pure calculations for one city and horizon. The pressure
 * trend at each hour is the change from the reading up to 24 samples earlier.
 */
export function calculateCityHorizonInsights(
  city: string,
  horizonHours: number,
  airQuality: ReadonlyArray<HourlyAirQuality>,
  weather: ReadonlyArray<HourlyWeather>,
  options?: { excludeNightHours?: boolean; safeAqiThreshold?: number },
): CityHorizonInsights {
  const hours = Math.max(0, Math.floor(horizonHours));
  const aq = airQuality.slice(0, hours);
  const met = weather.slice(0, hours);
  const stagnationIndex = met.flatMap((point, index) => {
    if (![point.windSpeed, point.boundaryLayerHeight, point.surfacePressure].every(isFiniteNumber)) return [];
    const prior = met[Math.max(0, index - 24)]?.surfacePressure;
    const trend = isFiniteNumber(prior) ? point.surfacePressure! - prior : 0;
    return [{
      time: point.time,
      ...calculateStagnationIndex(point.windSpeed!, point.boundaryLayerHeight!, point.surfacePressure!, trend),
    }];
  });
  return {
    city,
    horizon: `${hours}h`,
    cigaretteEquivalent: calculateCigaretteEquivalentFromHourly(
      airQuality.slice(-24).map((point) => point.pm25),
    ),
    stagnationIndex,
    bestOutdoorWindow: findBestOutdoorWindow(aq, options),
  };
}

/** Build the standard 24h, 48h, and 72h result objects for one city. */
export function calculateCityInsights(
  city: string,
  airQuality: ReadonlyArray<HourlyAirQuality>,
  weather: ReadonlyArray<HourlyWeather>,
  options?: { excludeNightHours?: boolean; safeAqiThreshold?: number },
): CityHorizonInsights[] {
  return [24, 48, 72].map((horizon) =>
    calculateCityHorizonInsights(city, horizon, airQuality, weather, options)
  );
}
