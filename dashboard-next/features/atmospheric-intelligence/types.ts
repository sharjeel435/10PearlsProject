export type CityName = "Karachi" | "Lahore" | "Islamabad";
export type PollutantKey = "pm2_5" | "pm10" | "nitrogen_dioxide" | "ozone" | "carbon_monoxide" | "sulphur_dioxide" | "dust" | "aerosol_optical_depth" | "uv_index";

export type PollutantReading = { key: PollutantKey; label: string; concentration: number | null; unit: string; aqi: number | null };

export type AtmosphericHour = {
  time: string; aqi: number | null; temperature: number | null; humidity: number | null;
  precipitation: number | null; rain: number | null; pressure: number | null; visibility: number | null;
  cloudCover: number | null; windSpeed: number | null; windDirection: number | null; windGusts: number | null;
  isDay: boolean | null; pollutants: Partial<Record<PollutantKey, PollutantReading>>;
};

export type AtmosphericCityData = { city: CityName; timezone: string; retrievedAt: string; hours: AtmosphericHour[] };
export type AtmosphericDataset = { cities: AtmosphericCityData[]; retrievedAt: string; unavailable: CityName[] };
export type WindowResult = { hours: AtmosphericHour[]; min: number; max: number; average: number };
export type DriverInsight = { id: string; title: string; explanation: string; tone: "warning" | "positive" | "neutral" };
export type DispersionLevel = "VERY WEAK" | "WEAK" | "MODERATE" | "GOOD" | "STRONG";

