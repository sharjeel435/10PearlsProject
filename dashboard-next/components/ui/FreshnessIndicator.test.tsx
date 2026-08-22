import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import FreshnessIndicator, { isHistoricalReplay } from "./FreshnessIndicator";

describe("FreshnessIndicator", () => {
  it("identifies a snapshot generated after the forecast window as a historical replay", () => {
    expect(
      isHistoricalReplay("2026-08-10T23:00:00Z", "2026-08-22T04:04:00Z")
    ).toBe(true);

    const html = renderToStaticMarkup(
      <FreshnessIndicator
        observationTime="2026-08-10T23:00:00Z"
        generatedTime="2026-08-22T04:04:00Z"
      />
    );

    expect(html).toContain("Historical Observation");
    expect(html).toContain("Replay Generated");
    expect(html).toContain("Historical replay");
    expect(html).toContain("not a live forecast");
  });

  it("keeps live forecast wording when generation is within the forecast window", () => {
    const html = renderToStaticMarkup(
      <FreshnessIndicator
        observationTime="2026-08-22T03:00:00Z"
        generatedTime="2026-08-22T04:04:00Z"
      />
    );

    expect(html).toContain("Forecast Generated");
    expect(html).not.toContain("Historical replay");
  });
});
