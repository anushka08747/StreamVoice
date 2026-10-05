import type { Observation } from "../types";
import { runRules } from "./rules";
import { llmCheck } from "./llmCheck";
import { isCounted } from "../insights/score";

/** Rules-only validation (sync, deterministic). Used on seed load and by tests. */
export function validateObservation(o: Observation, history: Observation[]): Observation {
  const flags = runRules(o, history);
  return flags.length ? { ...o, flags, status: "flagged" } : { ...o, flags: [], status: "accepted" };
}

/** Run rules over a list in date order; each entry is compared with earlier counted entries of the same stream. */
export function validateAll(list: Observation[]): Observation[] {
  const sorted = [...list].sort((a, b) => a.observedAt.localeCompare(b.observedAt));
  const done: Observation[] = [];
  for (const o of sorted) {
    if (o.status === "confirmed" || o.status === "corrected" || o.status === "rejected") {
      done.push(o);
      continue;
    }
    const hist = done.filter((d) => d.streamId === o.streamId && isCounted(d));
    done.push(validateObservation(o, hist));
  }
  return done;
}

/** Rules plus optional LLM second opinion, for newly submitted observations. */
export async function validateNew(o: Observation, history: Observation[]): Promise<Observation> {
  const base = validateObservation(o, history.filter((h) => h.streamId === o.streamId && isCounted(h)));
  const extra = await llmCheck(o);
  if (!extra) return base;
  return { ...base, flags: [...base.flags, extra], status: "flagged" };
}
