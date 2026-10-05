import { describe, it, expect } from "vitest";
import streams from "../data/streams.json";
import { seedObservations } from "../src/lib/store/seed";
import { computeInsights } from "../src/lib/insights/facts";
import { healthScore } from "../src/lib/insights/score";
import { trend } from "../src/lib/insights/trends";
import { confidence } from "../src/lib/insights/confidence";
import type { Observation, Stream } from "../src/lib/types";

const obs: Observation[] = seedObservations;
const get = (id: string) => computeInsights((streams as Stream[]).find((s) => s.id === id)!, obs);

describe("insights", () => {
  it("Berrys Creek declines with runoff signal", () => {
    const i = get("berrys-creek");
    expect(i.trend).toBe("declining");
    expect(i.risks.map((r) => r.code)).toContain("RUNOFF_SIGNAL");
  });
  it("Mill Creek stable, Overpeck Creek improving", () => {
    expect(get("mill-creek").trend).toBe("stable");
    expect(get("overpeck-creek").trend).toBe("improving");
  });
  it("score is null for fewer than 2 observations", () => {
    expect(healthScore([])).toBeNull();
    expect(trend(null, 50).trend).toBe("unknown");
    expect(trend(50, 50).trend).toBe("stable");
  });
  it("confidence tiers", () => {
    expect(confidence(6, 2, 0)).toBe("High");
    expect(confidence(4, 2, 0)).toBe("Medium");
    expect(confidence(8, 3, 1)).toBe("Low");
  });
  it("facts have stable ids and sources", () => {
    const f = get("berrys-creek").facts;
    expect(f.map((x) => x.id)).toEqual(f.map((_, k) => `F${k + 1}`));
    expect(f[0].sourceObservationIds.length).toBeGreaterThan(0);
  });
});
