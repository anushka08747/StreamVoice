import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createHash } from "crypto";
import { pcmToWav } from "@/lib/tts/wav";

export const maxDuration = 60;

const STYLE: Record<string, string> = {
  child: "Say warmly and gently, like a friendly teacher talking to a child",
  adult: "Say calmly and clearly",
  scientist: "Say in a neutral, precise tone",
};

const cache = new Map<string, Uint8Array>();

export async function POST(req: NextRequest) {
  const { text, level } = (await req.json().catch(() => ({}))) as { text?: string; level?: string };
  if (!text || text.length > 4000) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  if (process.env.TTS_PROVIDER === "browser" || !process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "tts_unavailable" }, { status: 503 });
  }
  const voice = process.env.TTS_VOICE ?? "Kore";
  const style = STYLE[level ?? "adult"] ?? STYLE.adult;
  const key = createHash("sha256").update(`${text}|${voice}|${style}`).digest("hex");
  let wav = cache.get(key);
  if (!wav) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const res = await ai.models.generateContent({
        model: process.env.TTS_MODEL ?? "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `${style}: ${text}` }] }],
        config: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } },
      });
      const b64 = res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!b64) throw new Error("no audio");
      wav = pcmToWav(new Uint8Array(Buffer.from(b64, "base64")));
      cache.set(key, wav);
    } catch {
      return NextResponse.json({ error: "tts_failed" }, { status: 502 });
    }
  }
  return new NextResponse(Buffer.from(wav), { headers: { "Content-Type": "audio/wav", "Cache-Control": "private, max-age=3600" } });
}
