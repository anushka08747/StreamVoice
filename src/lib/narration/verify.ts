import type { Fact, Sentence } from "../types";

const WORDS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, twenty: 20, hundred: 100,
};

/** Species and place names the narration must not introduce unless they appear in the facts or notes. */
export const KNOWN_NAMES = [
  "mayfly", "caddisfly", "stonefly", "water strider", "midge", "heron", "frog", "minnow", "duck", "dragonfly",
  "crayfish", "fish", "trout", "salmon", "otter", "beaver", "turtle", "swan", "kingfisher",
  "berrys creek", "mill creek", "overpeck creek",
];

const CAUSAL = [/is caused by/i, /was caused by/i, /because of the/i, /\bproves?\b/i, /\bdefinitely\b/i, /\bfor certain\b/i];

export function numbersIn(text: string): number[] {
  const out: number[] = [];
  for (const m of text.matchAll(/\d+(?:\.\d+)?/g)) out.push(Number(m[0]));
  const lower = text.toLowerCase().replace(/one health/g, "");
  for (const m of lower.matchAll(/\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|twenty|hundred)\b/g)) {
    out.push(WORDS[m[1]]);
  }
  return out;
}

function allowedNumbers(cited: Fact[]): Set<number> {
  const s = new Set<number>();
  for (const f of cited) {
    numbersIn(f.text).forEach((n) => s.add(n));
    for (const v of Object.values(f.values)) {
      if (typeof v === "number") {
        s.add(v);
        s.add(Math.abs(v));
      } else numbersIn(v).forEach((n) => s.add(n));
    }
  }
  return s;
}

/** Returns a list of failure reasons (empty = sentence passes). */
export function verifySentence(sent: Sentence, facts: Fact[], notesText = ""): string[] {
  const errs: string[] = [];
  const byId = new Map(facts.map((f) => [f.id, f]));
  const cited: Fact[] = [];
  for (const id of sent.factIds) {
    const f = byId.get(id);
    if (!f) errs.push(`Unknown fact id ${id}.`);
    else cited.push(f);
  }
  const allowed = allowedNumbers(cited);
  for (const n of numbersIn(sent.text)) {
    if (!allowed.has(n)) errs.push(`The number ${n} is not in the cited facts.`);
  }
  for (const re of CAUSAL) if (re.test(sent.text)) errs.push("Definitive causal wording is not allowed. Use hedged wording such as can signal or may point to.");
  const lower = sent.text.toLowerCase();
  const pool = (facts.map((f) => f.text).join(" ") + " " + notesText).toLowerCase();
  for (const name of KNOWN_NAMES) {
    if (lower.includes(name) && !pool.includes(name)) errs.push(`The name "${name}" is not in the facts or notes.`);
  }
  if (/[—–]/.test(sent.text)) errs.push("Do not use em dashes.");
  return errs;
}

export function verifyScript(script: Sentence[], facts: Fact[], notesText = ""): string[] {
  return script.flatMap((s, i) => verifySentence(s, facts, notesText).map((e) => `Sentence ${i + 1}: ${e}`));
}
