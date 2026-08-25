import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import FreshnessIndicator, { isHistoricalReplay } from "./FreshnessIndicator";

describe("FreshnessIndicator", () => {
  it("identifies a snapshot generated after the forecast window as a historical replay", () => {
    // Aug 10 observation, Aug 22 generation → >72h gap → historical replay
    expect(
      isHistoricalReplay("2026-08-10T23:00:00Z", "2026-08-22T04:04:00Z")
    ).toBe(true);

    const html = renderToStaticMarkup(
      <FreshnessIndicator
        observationTime="2026-08-10T23:00:00Z"
        generatedTime="2026-08-22T04:04:00Z"
      />
    );

    // New component shows "Historical Observation" label when historical replay
    expect(html).toContain("Historical Observation");
    // Stale warning badge should be visible (obs is very-stale)
    expect(html).toContain("Observation data stale");
  });

  it("keeps live forecast wording when generation is within the forecast window", () => {
    // Use a timestamp very close to "now" so freshness is live (< 3h ago)
    const nowMinus30min = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const nowMinus5min  = new Date(Date.now() - 5  * 60 * 1000).toISOString();

    const html = renderToStaticMarkup(
      <FreshnessIndicator
        observationTime={nowMinus30min}
        generatedTime={nowMinus5min}
      />
    );

    // When not historical replay, shows plain "Observation" label
    expect(html).toContain("Observation");
    expect(html).not.toContain("Historical Observation");
    // Recent observation (30 min ago) should NOT show stale warning
    expect(html).not.toContain("Observation data stale");
  });


  it("detects non-replay when generation is within 72h of observation", () => {
    expect(
      isHistoricalReplay("2026-08-22T00:00:00Z", "2026-08-22T04:00:00Z")
    ).toBe(false);
  });
});
