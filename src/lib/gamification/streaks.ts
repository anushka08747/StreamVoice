import type { Observation } from "../types";
import { isCounted } from "../insights/score";

const WEEK = 7 * 86400000;
const weekIndex = (iso: string) => Math.floor(Date.parse(iso.slice(0, 10) + "T00:00:00Z") / WEEK);

/** Longest run of consecutive weeks with at least one counted observation by this volunteer. */
export function longestStreak(obs: Observation[], observerId: string): number {
  const weeks = [...new Set(obs.filter((o) => o.observerId === observerId && isCounted(o)).map((o) => weekIndex(o.observedAt)))].sort((a, b) => a - b);
  let best = 0, run = 0, prev = -Infinity;
  for (const w of weeks) {
    run = w === prev + 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = w;
  }
  return best;
}

/** Streak ending at the most recent counted week (or 0). */
export function currentStreak(obs: Observation[], observerId: string): number {
  const weeks = [...new Set(obs.filter((o) => o.observerId === observerId && isCounted(o)).map((o) => weekIndex(o.observedAt)))].sort((a, b) => b - a);
  if (!weeks.length) return 0;
  let run = 1;
  for (let i = 1; i < weeks.length && weeks[i] === weeks[i - 1] - 1; i++) run++;
  return run;
}
