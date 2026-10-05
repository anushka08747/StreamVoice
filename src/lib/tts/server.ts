import type { Level, Sentence } from "../types";
import type { SpeakCallbacks, TtsProvider } from "./provider";

const TIMEOUT_MS = 8000;
const urlCache = new Map<string, string>();

async function fetchClip(text: string, level: Level, pregen?: string): Promise<string> {
  const key = `${level}|${text}`;
  const hit = urlCache.get(key);
  if (hit) return hit;
  if (pregen) {
    try {
      const r = await fetch(pregen);
      if (r.ok && (r.headers.get("content-type") ?? "").includes("audio")) {
        const url = URL.createObjectURL(await r.blob());
        urlCache.set(key, url);
        return url;
      }
    } catch { /* fall through to live generation */ }
  }
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, level }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error("tts " + res.status);
  const url = URL.createObjectURL(await res.blob());
  urlCache.set(key, url);
  return url;
}

type Clip = { sentenceIdx: number[]; text: string; pregen?: string };

/** One audio clip per narration beat, prefetching the next while the current one plays. */
export class ServerTts implements TtsProvider {
  readonly label = "AI voice" as const;
  private audio: HTMLAudioElement | null = null;
  private rate = 1;
  private token = 0;
  private sentenceTotal = 1;
  private currentSentence = 0;
  private tick: ReturnType<typeof setInterval> | null = null;

  constructor(private level: Level, private pregenPrefix?: string) {}

  setRate(r: number) { this.rate = r; if (this.audio) this.audio.playbackRate = r; }
  progress() { return this.currentSentence / this.sentenceTotal; }

  /** Must be called from a user gesture so playback is allowed. */
  speak(sentences: Sentence[], cb: SpeakCallbacks, startIndex = 0) {
    this.stop();
    const token = ++this.token;
    this.sentenceTotal = sentences.length || 1;
    const groups = new Map<number, number[]>();
    sentences.forEach((s, i) => { const b = s.beat ?? 0; groups.set(b, [...(groups.get(b) ?? []), i]); });
    const clips: Clip[] = [...groups.entries()].map(([b, idx]) => ({
      sentenceIdx: idx, text: idx.map((i) => sentences[i].text).join(" "),
      pregen: this.pregenPrefix ? `${this.pregenPrefix}-${b}.wav` : undefined,
    }));
    const audio = (this.audio = new Audio());
    audio.playbackRate = this.rate;
    const first = Math.max(0, clips.findIndex((c) => c.sentenceIdx.includes(startIndex)));
    const prefetch = (i: number) => { if (clips[i]) fetchClip(clips[i].text, this.level, clips[i].pregen).catch(() => {}); };

    const playClip = async (ci: number, skipTo?: number) => {
      if (token !== this.token) return;
      if (ci >= clips.length) { this.stopTick(); cb.onEnd(); return; }
      const clip = clips[ci];
      let url: string;
      try { url = await fetchClip(clip.text, this.level, clip.pregen); }
      catch { if (token === this.token) cb.onError?.(skipTo ?? clip.sentenceIdx[0]); return; }
      if (token !== this.token) return;
      audio.src = url;
      audio.playbackRate = this.rate;
      const chars = clip.sentenceIdx.map((i) => sentences[i].text.length);
      const totalChars = chars.reduce((a, b) => a + b, 0) || 1;
      let shown = -1;
      const show = () => {
        const dur = audio.duration || 1;
        const frac = audio.currentTime / dur;
        let acc = 0, k = 0;
        for (; k < chars.length - 1; k++) { acc += chars[k] / totalChars; if (frac < acc) break; }
        if (k !== shown) { shown = k; this.currentSentence = clip.sentenceIdx[k]; cb.onSentenceStart(clip.sentenceIdx[k]); }
      };
      this.stopTick();
      this.tick = setInterval(show, 120);
      audio.onloadedmetadata = () => {
        if (skipTo !== undefined) {
          const k = clip.sentenceIdx.indexOf(skipTo);
          const before = chars.slice(0, Math.max(0, k)).reduce((a, b) => a + b, 0);
          audio.currentTime = (before / totalChars) * audio.duration;
        }
      };
      audio.onended = () => playClip(ci + 1);
      audio.onerror = () => token === this.token && cb.onError?.(clip.sentenceIdx[0]);
      prefetch(ci + 1);
      try { await audio.play(); } catch { cb.onError?.(skipTo ?? clip.sentenceIdx[0]); }
    };
    playClip(first, startIndex);
  }

  private stopTick() { if (this.tick) clearInterval(this.tick); this.tick = null; }
  pause() { this.audio?.pause(); }
  resume() { this.audio?.play().catch(() => {}); }
  stop() { this.token++; this.stopTick(); if (this.audio) { this.audio.pause(); this.audio.removeAttribute("src"); } this.audio = null; }
}
