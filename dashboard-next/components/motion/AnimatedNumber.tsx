"use client";

import { useEffect, useState, useRef } from "react";
import { useReducedMotion } from "motion/react";

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
}

export default function AnimatedNumber({
  value,
  decimals = 0,
  duration = 0.5,
  className = "",
}: AnimatedNumberProps) {
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState<number>(value);
  const prevValueRef = useRef<number>(value);

  useEffect(() => {
    if (shouldReduceMotion || !Number.isFinite(value)) {
      prevValueRef.current = value;
      return;
    }

    const startValue = prevValueRef.current;
    const endValue = value;
    const startTime = performance.now();
    const durationMs = duration * 1000;

    let frameId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * easeOut;

      setDisplayValue(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        setDisplayValue(endValue);
        prevValueRef.current = endValue;
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [value, duration, shouldReduceMotion]);

  const effectiveValue = shouldReduceMotion || !Number.isFinite(value) ? value : displayValue;
  const formatted = Number.isFinite(effectiveValue)
    ? effectiveValue.toFixed(decimals)
    : "—";

  return <span className={`tabular ${className}`}>{formatted}</span>;
}
