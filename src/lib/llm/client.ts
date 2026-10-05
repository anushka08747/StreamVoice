import type { ZodType, z } from "zod";
import { geminiJson, llmAvailable, type JsonCallOpts } from "./gemini";

export { llmAvailable };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const retryable = (e: unknown) => {
  const m = String((e as Error)?.message ?? e);
  return /429|5\d\d|RESOURCE_EXHAUSTED|UNAVAILABLE|fetch failed/i.test(m);
};

/**
 * Provider-agnostic JSON generation: validates with Zod, retries once with backoff on 429/5xx,
 * and once more on malformed output. Throws if the LLM is unavailable or keeps failing; callers fall back.
 */
export async function generateJson<S extends ZodType>(prompt: string, schema: S, opts: JsonCallOpts = {}): Promise<z.infer<S>> {
  if (!llmAvailable()) throw new Error("LLM_UNAVAILABLE");
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await geminiJson(prompt, schema, opts);
      return schema.parse(raw);
    } catch (e) {
      lastErr = e;
      if (attempt === 0) await sleep(retryable(e) ? 800 : 0);
    }
  }
  throw lastErr;
}
