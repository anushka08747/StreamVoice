import type { Sentence } from "../types";
import type { SpeakCallbacks, TtsProvider } from "./provider";

export const browserTtsSupported = () => typeof window !== "undefined" && "speechSynthesis" in window;

export class BrowserTts implements TtsProvider {
  readonly label = "Device voice" as const;
  private rate = 1;
  private current = 0;
  private total = 1;
  private token = 0;

  setRate(r: number) { this.rate = r; }
  progress() { return this.current / this.total; }

  speak(sentences: Sentence[], cb: SpeakCallbacks, startIndex = 0) {
    this.stop();
    const token = ++this.token;
    this.total = sentences.length || 1;
    const next = (i: number) => {
      if (token !== this.token) return;
      if (i >= sentences.length) { this.current = sentences.length; cb.onEnd(); return; }
      this.current = i;
      const u = new SpeechSynthesisUtterance(sentences[i].text);
      u.rate = this.rate;
      const voices = window.speechSynthesis.getVoices();
      const v = voices.find((x) => x.lang.startsWith("en") && /natural|google|samantha|aria|jenny/i.test(x.name)) ?? voices.find((x) => x.lang.startsWith("en"));
      if (v) u.voice = v;
      u.onstart = () => token === this.token && cb.onSentenceStart(i);
      u.onend = () => next(i + 1);
      u.onerror = (e) => { if (token === this.token && e.error !== "canceled" && e.error !== "interrupted") cb.onError?.(i); };
      window.speechSynthesis.speak(u);
    };
    next(startIndex);
  }

  pause() { window.speechSynthesis.pause(); }
  resume() { window.speechSynthesis.resume(); }
  stop() { this.token++; window.speechSynthesis?.cancel(); }
}
