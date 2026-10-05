import type { Level, OneHealthEntry } from "../types";
import type { Insights } from "../insights/facts";
import { activeRiskCodes } from "./outline";
import { oneHealthNotes } from "../store/seed";

export function oneHealthFor(insights: Insights, level: Level): OneHealthEntry[] {
  return activeRiskCodes(insights.facts).map((code) => {
    const n = oneHealthNotes[code];
    return { code, label: n.label, people: n.people[level], pets: n.pets[level], wildlife: n.wildlife[level], environment: n.environment[level] };
  });
}
