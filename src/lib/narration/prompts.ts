import type { Fact, Level, OneHealthEntry } from "../types";
import type { Beat } from "./outline";

const STYLE: Record<Level, string> = {
  child: "Short sentences, simple words, friendly tone, for a young child.",
  adult: "Plain, practical language for a general adult.",
  scientist: "Precise terms. Mention scores and confidence where cited.",
};

export const SYSTEM = `You write a short spoken briefing about a stream from citizen science observations.
Rules:
- Use only the numbers and statements in the provided facts. Do not add new numbers, species, causes, or places.
- Hedged causality only: use "can signal" or "may point to". Never state a definite cause.
- Every sentence must list the ids of the facts it relies on in factIds. Use [] only if it uses no fact.
- For the "why it matters" content use only the provided notes.
- Never use em dashes. Output JSON only.`;

export function sectionPrompt(beat: Beat, facts: Fact[], notes: OneHealthEntry[], level: Level, streamName: string, failure?: string, words = beat.targetWords): string {
  const f = facts.filter((x) => beat.factIds.includes(x.id)).map((x) => `${x.id}: ${x.text}`).join("\n") || "(none)";
  const n = beat.noteCategories.length
    ? notes.map((e) => `${e.label}: ` + beat.noteCategories.map((c) => `${c}: ${e[c]}`).join(" | ")).join("\n")
    : "(none)";
  return `Stream: ${streamName}
Listener style: ${STYLE[level]}
Write about ${words} words (1 to 4 sentences) for this part of the briefing: ${beat.title}.
Facts you may cite:
${f}
Notes you may paraphrase (no new facts):
${n}
${failure ? `Your previous attempt was rejected: ${failure} Fix this.` : ""}
Return JSON: {"sentences":[{"text": string, "factIds": string[]}]}`;
}
