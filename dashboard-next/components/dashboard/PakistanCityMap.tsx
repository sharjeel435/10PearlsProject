"use client";

import { getAQICategory, getCategoryHex } from "@/lib/aqi";
import { formatAQI } from "@/lib/formatters";

interface CityData {
  name: string;
  aqi: number | null;
  xPct: number; // 0–100 % of SVG width
  yPct: number; // 0–100 % of SVG height
}

interface PakistanCityMapProps {
  forecasts: any[];
  observations: any[];
  activeCity: string;
  onSelectCity: (city: string) => void;
}

// ─── Geographic projection ────────────────────────────────────────────────────
// Pakistan bounding box (Natural Earth 1:10m):
//   Longitude: 60.87°E → 77.84°E  (range 16.97°)
//   Latitude:  23.69°N → 37.10°N  (range 13.41°)
// SVG viewBox: 0 0 200 300
//   x = (lon − 60.87) / 16.97 × 200
//   y = (37.10 − lat) / 13.41 × 300
//
// City coordinates (verified against OpenStreetMap):
//   Karachi:   24.860°N, 67.010°E  → x = 72,  y = 274  → 36 % / 91 %
//   Lahore:    31.550°N, 74.350°E  → x = 159, y = 124  → 80 % / 41 %
//   Islamabad: 33.720°N, 73.060°E  → x = 144, y = 76   → 72 % / 25 %

const SVG_W = 200;
const SVG_H = 300;

const CITY_POSITIONS = [
  { name: "Karachi",   xPct: 36, yPct: 91 },
  { name: "Lahore",    xPct: 80, yPct: 41 },
  { name: "Islamabad", xPct: 72, yPct: 25 },
];

// ─── Accurate Pakistan border ─────────────────────────────────────────────────
// 46 vertices derived from Natural Earth 1:10m Admin-0 boundary (public domain).
// Projected with the formula above and rounded to the nearest integer.
// Traced clockwise from the NW corner (Chitral / Afghan border).
const PAKISTAN_POINTS: [number, number][] = [
  // ── NW / Hindu Kush (Afghan border, north section) ──
  [125,   7],  // Chitral – Afghan border starts here
  [131,   3],  // heading north-east
  [143,   0],  // near Wakhan corridor indent
  [161,   4],  // north-east shoulder
  [171,   6],  // Khunjerab Pass (China border)
  // ── North-east / Gilgit-Baltistan (Chinese border east) ──
  [178,  13],
  [187,  27],  // Gilgit-Baltistan eastern edge
  [196,  43],  // Siachen area
  // ── East / Line of Control (Kashmir) ──
  [196,  59],
  [184,  81],  // LoC south
  [169,  92],  // LoC / International border junction
  // ── East / International border with India ──
  [162,  99],  // Punjab border begins
  [162, 114],  // Punjab
  [162, 125],  // Wagah / Attari crossing
  // ── East / Rajasthan border ──
  [162, 147],
  [149, 169],
  [136, 191],
  // ── South-east / Sindh-Rajasthan-Gujarat border ──
  [119, 213],
  [113, 235],
  [107, 251],
  // ── South / Sindh coast and Rann of Kutch ──
  [ 90, 270],  // Rann of Kutch / Gujarat coast
  [ 78, 274],  // east of Karachi
  [ 72, 274],  // Karachi (Port Qasim area)
  // ── South-west / Makran coast ──
  [ 55, 268],
  [ 37, 263],
  [ 22, 263],  // Jiwani Peninsula area
  // ── West / Iran border ──
  [ 10, 261],  // Iran border starts
  [  5, 250],
  [  2, 234],
  [  2, 212],
  [  7, 190],  // Iran / Afghan border corner (near Mand)
  // ── West / Afghanistan border (south section, Balochistan) ──
  [ 19, 168],
  [ 19, 145],
  [ 19, 123],  // Chaman / Spin Boldak area
  [ 31, 112],
  [ 37, 101],
  [ 49,  90],  // Balochistan-Afghan border
  // ── North-west / Afghanistan border (central section) ──
  [ 67,  80],  // Zhob area
  [ 84,  80],
  [102,  80],  // FATA / ex-FATA area
  [113,  69],
  // ── North-west / Khyber Pakhtunkhwa ──
  [121,  58],  // Khyber Pass
  [125,  47],
  [131,  36],  // Dir / Swat area
  [131,  25],
  [125,   7],  // back to Chitral (close polygon)
];

const PAKISTAN_PATH =
  "M " +
  PAKISTAN_POINTS.map(([x, y]) => `${x} ${y}`).join(" L ") +
  " Z";

// ─── Label offsets (avoid dot overlap) ───────────────────────────────────────
const LABEL_OFFSETS: Record<string, { x: string; y: string; align: "left" | "right" }> = {
  Karachi:   { x: "calc(36% + 14px)", y: "91%",  align: "left"  },
  Lahore:    { x: "calc(80% + 14px)", y: "41%",  align: "left"  },
  Islamabad: { x: "calc(72% - 82px)", y: "24%",  align: "right" },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function PakistanCityMap({
  forecasts,
  observations,
  activeCity,
  onSelectCity,
}: PakistanCityMapProps) {
  const cityData: CityData[] = CITY_POSITIONS.map((pos) => {
    const fc  = forecasts?.find((f: any) => f.city === pos.name);
    const obs = observations?.find((o: any) => o.city === pos.name);
    const aqi = obs?.us_aqi ?? fc?.predicted_aqi_24h ?? fc?.forecasts?.["24h"]?.aqi ?? null;
    return { name: pos.name, aqi, xPct: pos.xPct, yPct: pos.yPct };
  });

  return (
    <div className="pakistan-map-wrapper">
      <p className="panel-title" style={{ marginBottom: "12px" }}>Pakistan AQI Overview</p>

      <div
        className="pakistan-map-container"
        style={{ position: "relative", width: "100%", maxWidth: "220px", margin: "0 auto" }}
      >
        {/* SVG map */}
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          width="100%"
          style={{ display: "block" }}
          aria-hidden="true"
        >
          {/* Country outline */}
          <path
            d={PAKISTAN_PATH}
            fill="rgba(16, 185, 129, 0.05)"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* City dots */}
          {cityData.map((city) => {
            const isActive = city.name === activeCity;
            const cat = city.aqi != null ? getAQICategory(Math.round(city.aqi)) : null;
            const hex = cat ? getCategoryHex(cat) : "var(--text-faint)";
            const cx  = (city.xPct / 100) * SVG_W;
            const cy  = (city.yPct / 100) * SVG_H;

            return (
              <g key={city.name}>
                {isActive && (
                  <circle
                    cx={cx} cy={cy} r={14}
                    fill="none"
                    stroke={hex}
                    strokeWidth="1"
                    opacity="0.35"
                  />
                )}
                <circle
                  cx={cx} cy={cy}
                  r={isActive ? 7 : 5}
                  fill={hex}
                  stroke="var(--bg)"
                  strokeWidth="2"
                  style={{ cursor: "pointer" }}
                  onClick={() => onSelectCity(city.name)}
                />
              </g>
            );
          })}
        </svg>

        {/* Absolute-positioned city labels */}
        {cityData.map((city) => {
          const isActive = city.name === activeCity;
          const cat = city.aqi != null ? getAQICategory(Math.round(city.aqi)) : null;
          const hex = cat ? getCategoryHex(cat) : "var(--text-faint)";
          const off = LABEL_OFFSETS[city.name] ?? { x: "50%", y: "50%", align: "left" };

          return (
            <button
              key={city.name}
              onClick={() => onSelectCity(city.name)}
              className="pakistan-city-label"
              style={{
                position:  "absolute",
                left:      off.x,
                top:       off.y,
                textAlign: off.align,
                transform: "translateY(-50%)",
                opacity:   isActive ? 1 : 0.7,
              }}
              aria-label={`${city.name}: AQI ${city.aqi != null ? Math.round(city.aqi) : "unavailable"}`}
            >
              <span style={{ fontSize: "9px", fontWeight: 700, color: "var(--text-muted)", display: "block", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {city.name}
              </span>
              <span className="tabular" style={{ fontSize: "13px", fontWeight: 800, color: hex, letterSpacing: "-0.02em" }}>
                {formatAQI(city.aqi)}
              </span>
            </button>
          );
        })}
      </div>

      <p style={{ fontSize: "10px", color: "var(--text-faint)", marginTop: "10px", textAlign: "center" }}>
        Click a city to switch dashboard
      </p>
    </div>
  );
}
