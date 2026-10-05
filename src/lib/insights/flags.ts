import type { Observation, RiskCode } from "../types";
import { mean, distinctSpecies } from "./score";

export const RISK_LABELS: Record<RiskCode, string> = {
  RUNOFF_SIGNAL: "Possible runoff",
  LITTER_RISING: "More litter",
  ODOR_REPORTED: "Bad smell reported",
  LOW_BIODIVERSITY: "Few species seen",
  LOW_DATA: "Not enough checks yet",
};

export type RiskResult = { code: RiskCode; sourceObservationIds: string[]; strengthened?: boolean };

/** cur and prev are counted observations only. */
export function riskFlags(cur: Observation[], prev: Observation[]): RiskResult[] {
  const out: RiskResult[] = [];
  const ids = (xs: Observation[]) => xs.map((o) => o.id);

  if (cur.length >= 1 && prev.length >= 1) {
    const clarityDrop = mean(prev.map((o) => o.clarity)) - mean(cur.map((o) => o.clarity));
    const prevSp = distinctSpecies(prev);
    const curSp = distinctSpecies(cur);
    if (clarityDrop >= 1 && prevSp > 0 && (prevSp - curSp) / prevSp >= 0.2) {
      const rain = cur.filter((o) => o.weather === "heavy_rain");
      out.push({ code: "RUNOFF_SIGNAL", sourceObservationIds: ids([...prev, ...cur]), strengthened: rain.length > 0 });
    }
    const litterUp = mean(cur.map((o) => o.litter)) - mean(prev.map((o) => o.litter));
    if (litterUp >= 0.75) out.push({ code: "LITTER_RISING", sourceObservationIds: ids([...prev, ...cur]) });
  }
  const smelly = cur.filter((o) => o.smell === "sewage" || o.smell === "chemical");
  if (smelly.length) out.push({ code: "ODOR_REPORTED", sourceObservationIds: ids(smelly) });
  if (cur.length >= 1 && distinctSpecies(cur) <= 2) out.push({ code: "LOW_BIODIVERSITY", sourceObservationIds: ids(cur) });
  if (cur.length < 3) out.push({ code: "LOW_DATA", sourceObservationIds: ids(cur) });
  return out;
}
