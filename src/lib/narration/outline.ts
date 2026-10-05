import type { Fact, Level, Minutes, RiskCode } from "../types";

export const WORDS_PER_MINUTE = 150;
export const TOLERANCE = 0.15;

export type BeatKey = "open" | "score" | "metrics" | "signal" | "why_people" | "why_wild" | "confidence";

export type Beat = {
  index: number;
  keys: BeatKey[];
  title: string;
  factIds: string[];
  noteCategories: ("people" | "pets" | "wildlife" | "environment")[];
  targetWords: number;
};

const PLANS: Record<Minutes, BeatKey[][]> = {
  1: [["open", "score"], ["metrics", "signal"], ["why_people", "why_wild", "confidence"]],
  2: [["open"], ["score", "metrics"], ["signal"], ["why_people", "why_wild"], ["confidence"]],
  3: [["open"], ["score"], ["metrics"], ["signal"], ["why_people"], ["why_wild"], ["confidence"]],
};

const TITLES: Record<BeatKey, string> = {
  open: "opening with the number of checks and the stream name",
  score: "the health score and its trend",
  metrics: "what changed in clarity, species and litter",
  signal: "what it may signal",
  why_people: "why it matters for people and pets",
  why_wild: "why it matters for wildlife and the environment",
  confidence: "how confident we are and how to help",
};

export function factsForKey(key: BeatKey, facts: Fact[]): Fact[] {
  const has = (f: Fact, k: string) => k in f.values;
  switch (key) {
    case "open":
      return facts.filter((f) => f.kind === "count" && has(f, "observations"));
    case "score":
      return facts.filter((f) => f.kind === "score" || (f.kind === "trend" && has(f, "trend")));
    case "metrics":
      return facts.filter((f) => f.kind === "trend" && !has(f, "trend"));
    case "signal":
    case "why_people":
    case "why_wild":
      return facts.filter((f) => f.kind === "risk");
    case "confidence":
      return facts.filter((f) => f.kind === "count" && has(f, "confidence"));
  }
}

export function activeRiskCodes(facts: Fact[]): RiskCode[] {
  return facts.filter((f) => f.kind === "risk").map((f) => String(f.values.code) as RiskCode);
}

/** Deterministic outline: code decides which facts each beat may cite and the word budget. */
export function buildOutline(facts: Fact[], _level: Level, minutes: Minutes): Beat[] {
  const plan = PLANS[minutes];
  const budget = minutes * WORDS_PER_MINUTE;
  return plan.map((keys, index) => {
    const ids = [...new Set(keys.flatMap((k) => factsForKey(k, facts).map((f) => f.id)))];
    const cats = new Set<Beat["noteCategories"][number]>();
    if (keys.includes("why_people")) (["people", "pets"] as const).forEach((c) => cats.add(c));
    if (keys.includes("why_wild")) (["wildlife", "environment"] as const).forEach((c) => cats.add(c));
    return {
      index,
      keys,
      title: keys.map((k) => TITLES[k]).join("; "),
      factIds: ids,
      noteCategories: [...cats],
      targetWords: Math.round(budget / plan.length),
    };
  });
}
