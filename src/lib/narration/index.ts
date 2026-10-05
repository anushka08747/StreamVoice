import type { BriefingResponse, Level, Minutes, Sentence } from "../types";
import type { Insights } from "../insights/facts";
import { buildOutline, TOLERANCE, WORDS_PER_MINUTE } from "./outline";
import { fallbackScript } from "./fallback";
import { writeBeat } from "./sections";
import { llmAvailable } from "../llm/client";
import { verifyScript } from "./verify";
import { oneHealthFor } from "./onehealth";

export const wordCount = (s: Sentence[]) => s.reduce((n, x) => n + x.text.split(/\s+/).filter(Boolean).length, 0);

export { oneHealthFor };

export async function generateBriefing(insights: Insights, level: Level, minutes: Minutes): Promise<BriefingResponse> {
  const { facts } = insights;
  const streamName = insights.stream.name;
  const notes = oneHealthFor(insights, level);
  const beats = buildOutline(facts, level, minutes);
  const ctx = { facts, notes, level, streamName };
  const budget = minutes * WORDS_PER_MINUTE;
  const base = { facts, confidence: insights.confidence, oneHealth: notes };

  const template = (): BriefingResponse => {
    const script = fallbackScript(beats, ctx);
    return { ...base, script, wordCount: wordCount(script), source: "template" };
  };
  if (!llmAvailable()) return template();

  try {
    let results = await Promise.all(beats.map((b) => writeBeat(b, facts, notes, level, streamName)));
    let words = wordCount(results.flatMap((r) => r.sentences));
    // One targeted expand or trim pass when outside tolerance.
    if (words < budget * (1 - TOLERANCE) || words > budget * (1 + TOLERANCE)) {
      const scale = budget / words;
      results = await Promise.all(beats.map((b, i) => {
        const cur = wordCount(results[i].sentences);
        return results[i].source === "ai" ? writeBeat(b, facts, notes, level, streamName, Math.round(cur * scale)) : Promise.resolve(results[i]);
      }));
    }
    const script = results.flatMap((r) => r.sentences);
    const notesText = notes.map((n) => `${n.people} ${n.pets} ${n.wildlife} ${n.environment}`).join(" ");
    if (verifyScript(script, facts, notesText).length) return template();
    const allAi = results.every((r) => r.source === "ai");
    return { ...base, script, wordCount: wordCount(script), source: allAi ? "ai" : "template" };
  } catch {
    if (process.env.DEMO_FALLBACK === "false") throw new Error("Briefing failed");
    return template();
  }
}
