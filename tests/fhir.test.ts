import { describe, it, expect } from "vitest";
import { observationResource, fhirStatus } from "../src/lib/fhir/mapper";
import { buildBundle } from "../src/lib/fhir/bundle";
import { seedObservations, streams } from "../src/lib/store/seed";
import { longestStreak } from "../src/lib/gamification/streaks";

describe("fhir", () => {
  it("maps statuses", () => {
    expect(fhirStatus("accepted")).toBe("final");
    expect(fhirStatus("corrected")).toBe("final");
    expect(fhirStatus("flagged")).toBe("preliminary");
    expect(fhirStatus("rejected")).toBe("entered-in-error");
  });
  it("observation has required fields", () => {
    const r = observationResource(seedObservations[0]);
    expect(r.resourceType).toBe("Observation");
    expect(r.status).toBe("final");
    expect(r.subject.reference).toMatch(/^Location\//);
    expect(r.effectiveDateTime).toBeTruthy();
    expect(r.component.length).toBe(5);
  });
  it("bundle contains location, persons, observations", () => {
    const b = buildBundle(streams[0], seedObservations);
    const types = b.entry.map((e) => e.resource.resourceType);
    expect(b.type).toBe("collection");
    expect(types).toContain("Location");
    expect(types).toContain("Person");
    expect(types.filter((t) => t === "Observation").length).toBe(8);
  });
});

describe("gamification", () => {
  it("counts consecutive weeks", () => {
    const mk = (d: string) => ({ ...seedObservations[0], observerId: "x", observedAt: d, status: "accepted" as const });
    expect(longestStreak([mk("2026-09-01"), mk("2026-09-08"), mk("2026-09-15")], "x")).toBe(3);
    expect(longestStreak([mk("2026-09-01"), mk("2026-09-20")], "x")).toBe(1);
  });
});
