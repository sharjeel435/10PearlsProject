"use client";

import Tooltip from "@/components/ui/Tooltip";
import type { LatestObservation } from "@/lib/types";

interface AirCompositionPanelProps {
  observation: LatestObservation | null | undefined;
}

const POLLUTANTS = [
  { code: "PM2.5", name: "Fine Particulate Matter", key: "pm2_5",            unit: "µg/m³", maxRef: 100 },
  { code: "PM10",  name: "Coarse Particles",         key: "pm10",             unit: "µg/m³", maxRef: 150 },
  { code: "NO₂",   name: "Nitrogen Dioxide",         key: "nitrogen_dioxide", unit: "µg/m³", maxRef: 50  },
  { code: "SO₂",   name: "Sulphur Dioxide",          key: "sulphur_dioxide",  unit: "µg/m³", maxRef: 40  },
  { code: "CO",    name: "Carbon Monoxide",           key: "carbon_monoxide",  unit: "µg/m³", maxRef: 600 },
  { code: "O₃",    name: "Surface Ozone",             key: "ozone",            unit: "µg/m³", maxRef: 120 },
];

export default function AirCompositionPanel({ observation }: AirCompositionPanelProps) {
  return (
    <div>
      <p className="panel-title">Air Composition</p>

      <div className="data-list" style={{ paddingTop: "4px" }}>
        {POLLUTANTS.map((p) => {
          const raw = observation?.[p.key as keyof LatestObservation];
          const val = raw != null && Number.isFinite(Number(raw)) ? Number(raw) : null;
          const pct = val != null ? Math.min(Math.round((val / p.maxRef) * 100), 100) : 0;

          return (
            <div key={p.code} className="pollutant-row">
              <div className="pollutant-code-col">
                <Tooltip term={p.code} customText={p.name}>
                  <span style={{ cursor: "help", borderBottom: "1px dashed var(--border-medium)" }}>
                    {p.code}
                  </span>
                </Tooltip>
              </div>

              <div className="pollutant-bar-col">
                <div
                  className="pollutant-bar-fill"
                  style={{ width: val != null ? `${pct}%` : "0%" }}
                />
              </div>

              <div className="pollutant-val-col tabular">
                {val != null ? val.toFixed(1) : "—"}
              </div>

              <div className="pollutant-unit-col">{p.unit}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
