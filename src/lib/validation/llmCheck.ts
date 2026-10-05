import { z } from "zod";
import type { Observation, ValidationFlag } from "../types";
import { generateJson, llmAvailable } from "../llm/client";

const Schema = z.object({ suspicious: z.boolean(), reason: z.string() });

/** Optional second opinion. Skips silently if the LLM is unavailable or fails. */
export async function llmCheck(o: Observation): Promise<ValidationFlag | null> {
  if (!llmAvailable()) return null;
  const prompt = `You check citizen-science stream observations for internal contradictions only.
Fields: clarity ${o.clarity} (1 murky, 5 clear), smell ${o.smell}, species ${JSON.stringify(o.species)}, litter ${o.litter} (0 none, 3 heavy), weather ${o.weather}, notes ${JSON.stringify(o.notes ?? "")}.
Return JSON {"suspicious": boolean, "reason": string}. Mark suspicious only if fields clearly contradict each other. Reason is one short plain sentence. Do not use em dashes.`;
  try {
    const r = await generateJson(prompt, Schema, { temperature: 0.2 });
    return r.suspicious ? { code: "LLM_CONTRADICTION", message: r.reason, source: "llm" } : null;
  } catch {
    return null;
  }
}
