import type { Observation, Smell } from "../types";

export const ANCHOR_DATE = "2026-09-30";
const DAY = 86400000;

export type Period = { start: string; end: string };
export type PeriodName = "current" | "previous";

const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Current = the 30 days ending at anchor (inclusive); previous = the 30 days before that. */
export function periods(anchor: string = ANCHOR_DATE): Record<PeriodName, Period> {
  const a = Date.parse(anchor + "T00:00:00Z");
  return {
    current: { start: iso(a - 29 * DAY), end: iso(a) },
    previous: { start: iso(a - 59 * DAY), end: iso(a - 30 * DAY) },
  };
}

export const isCounted = (o: Observation) =>
  o.status === "accepted" || o.status === "confirmed" || o.status === "corrected";

export function inPeriod(o: Observation, p: Period): boolean {
  const d = o.observedAt.slice(0, 10);
  return d >= p.start && d <= p.end;
}

export function counted(obs: Observation[], p: Period): Observation[] {
  return obs.filter((o) => isCounted(o) && inPeriod(o, p));
}

export const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
export const round1 = (n: number) => Math.round(n * 10) / 10;

export function distinctSpecies(obs: Observation[]): number {
  return new Set(obs.flatMap((o) => o.species.map((s) => s.trim().toLowerCase()))).size;
}

const smellScore = (s: Smell) => (s === "none" || s === "earthy" ? 100 : s === "other" ? 50 : 0);

export type PeriodMetrics = {
  n: number;
  observers: number;
  clarity: number;
  species: number;
  litter: number;
  score: number | null;
};

/** Weighted blend 0..100: clarity 40, species 30, litter 15, smell 15. Null if fewer than 2 counted observations. */
export function healthScore(obs: Observation[]): number | null {
  if (obs.length < 2) return null;
  const clarity = ((mean(obs.map((o) => o.clarity)) - 1) / 4) * 100;
  const species = (Math.min(distinctSpecies(obs), 6) / 6) * 100;
  const litter = (1 - mean(obs.map((o) => o.litter)) / 3) * 100;
  const smell = mean(obs.map((o) => smellScore(o.smell)));
  return Math.round(0.4 * clarity + 0.3 * species + 0.15 * litter + 0.15 * smell);
}

export function metrics(obs: Observation[]): PeriodMetrics {
  return {
    n: obs.length,
    observers: new Set(obs.map((o) => o.observerId)).size,
    clarity: round1(mean(obs.map((o) => o.clarity))),
    species: distinctSpecies(obs),
    litter: round1(mean(obs.map((o) => o.litter))),
    score: healthScore(obs),
  };
}
