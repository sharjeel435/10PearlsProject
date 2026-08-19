"use client";

import { motion } from "motion/react";

interface CitySelectorProps {
  cities: string[];
  activeCity: string;
  onSelectCity: (city: string) => void;
}

export default function CitySelector({ cities, activeCity, onSelectCity }: CitySelectorProps) {
  return (
    <div className="city-selector-bar" aria-label="City selector">
      {cities.map((city) => {
        const isActive = city === activeCity;
        return (
          <button
            key={city}
            className={`city-btn${isActive ? " active" : ""}`}
            onClick={() => onSelectCity(city)}
            aria-pressed={isActive}
          >
            {isActive && (
              <motion.div
                layoutId="city-active-bg"
                className="city-active-bg"
                transition={{ type: "spring", stiffness: 400, damping: 34 }}
              />
            )}
            <span className="city-btn-label">{city}</span>
          </button>
        );
      })}
    </div>
  );
}
