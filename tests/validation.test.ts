import { describe, it, expect } from "vitest";
import { seedObservations } from "../src/lib/store/seed";
import { runRules } from "../src/lib/validation/rules";
import { computeInsights } from "../src/lib/insights/facts";
import { streams } from "../src/lib/store/seed";

describe("validation", () => {
  const flagged = seedObservations.filter((o) => o.status === "flagged");
  it("flags exactly the three planted entries", () => {
    expect(flagged.map((o) => o.flags[0].code).sort()).toEqual(
      ["CLEAR_BUT_ALGAE_NOTE", "FISH_BUT_HEAVY_POLLUTION", "NO_LITTER_BUT_TRASH_NOTE"]
    );
  });
  it("does not flag clean entries", () => {
    const clean = seedObservations.filter((o) => o.status === "accepted");
    expect(clean.length).toBe(21);
    for (const o of clean) expect(runRules(o, [])).toEqual([]);
  });
  it("rain/clarity mismatch fires", () => {
    const o = { ...seedObservations[0], weather: "heavy_rain" as const, clarity: 5 as const, notes: undefined };
    expect(runRules(o).map((f) => f.code)).toContain("RAIN_CLARITY_MISMATCH");
  });
  it("flagged entries are excluded and Berrys Creek shows runoff", () => {
    const i = computeInsights(streams[0], seedObservations);
    expect(i.pending).toBe(1);
    expect(i.confidence).toBe("Low");
    expect(i.trend).toBe("declining");
    expect(i.risks.map((r) => r.code)).toContain("RUNOFF_SIGNAL");
  });
});
