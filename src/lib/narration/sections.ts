import { z } from "zod";
import type { Fact, Level, OneHealthEntry, Sentence } from "../types";
import type { Beat } from "./outline";
import { generateJson } from "../llm/client";
import { sectionPrompt, SYSTEM } from "./prompts";
import { verifySentence } from "./verify";
import { fallbackBeat } from "./fallback";

const Schema = z.object({ sentences: z.array(z.object({ text: z.string().min(1), factIds: z.array(z.string()) })).min(1).max(6) });

export type BeatResult = { sentences: Sentence[]; source: "ai" | "template" };

/** One beat: LLM writes, verifier checks, up to 2 retries with the failure reason, else the deterministic template. */
export async function writeBeat(beat: Beat, facts: Fact[], notes: OneHealthEntry[], level: Level, streamName: string, words = beat.targetWords): Promise<BeatResult> {
  const notesText = notes.map((n) => `${n.people} ${n.pets} ${n.wildlife} ${n.environment}`).join(" ");
  let failure: string | undefined;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const out = await generateJson(sectionPrompt(beat, facts, notes, level, streamName, failure, words), Schema, { system: SYSTEM, temperature: 0.3 });
      const sentences: Sentence[] = out.sentences.map((s) => ({ ...s, beat: beat.index }));
      const errs = sentences.flatMap((s) => verifySentence(s, facts, notesText));
      if (!errs.length) return { sentences, source: "ai" };
      failure = errs.slice(0, 3).join(" ");
    } catch (e) {
      if (String((e as Error).message).includes("LLM_UNAVAILABLE")) break;
      failure = "The output was not valid JSON for the schema.";
    }
  }
  return { sentences: fallbackBeat(beat, { facts, notes, level, streamName }), source: "template" };
}
