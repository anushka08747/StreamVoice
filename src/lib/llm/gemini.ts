import { GoogleGenAI } from "@google/genai";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { ZodType } from "zod";

export type JsonCallOpts = { temperature?: number; system?: string };

let client: GoogleGenAI | null = null;
const getClient = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  return (client ??= new GoogleGenAI({ apiKey: key }));
};

export const llmAvailable = () => !!process.env.GEMINI_API_KEY && (process.env.LLM_PROVIDER ?? "gemini") === "gemini";

/** One JSON-mode Gemini call. Returns raw parsed JSON (caller validates with Zod). */
export async function geminiJson(prompt: string, schema: ZodType, opts: JsonCallOpts = {}): Promise<unknown> {
  const ai = getClient();
  if (!ai) throw new Error("NO_API_KEY");
  const res = await ai.models.generateContent({
    model: process.env.LLM_MODEL ?? "gemini-2.5-flash",
    contents: prompt,
    config: {
      systemInstruction: opts.system,
      temperature: opts.temperature ?? 0.3,
      responseMimeType: "application/json",
      responseJsonSchema: zodToJsonSchema(schema, { $refStrategy: "none" }),
      thinkingConfig: { thinkingBudget: 0 },
    },
  });
  return JSON.parse(res.text ?? "");
}
